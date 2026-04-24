
import type { RateLimitConfig, ESPName } from '../types/emailServiceSelector.type.js'

/**
 * Défauts embarqués par ESP, exprimés en envois par seconde.
 *
 * - resend   : 10/s (limite officielle Resend)
 * - brevo    : 100/s (conservative, plan business)
 * - postmark : 10/s (safe default Postmark)
 * - nodemailer : 5/s (prudent SMTP, dépend fortement du fournisseur)
 * - emailserviceviewer / local : 1000/s (viewer de test — pas de vraie limite)
 *
 * Ces défauts s'appliquent UNIQUEMENT si `config.rateLimit` est absent. Dès
 * qu'une valeur `rateLimit` est fournie par le consommateur, elle remplace
 * complètement le défaut (pas de merge partiel).
 */
export const RATE_LIMIT_DEFAULTS: Record<ESPName, RateLimitConfig> = {
	resend: { perSecond: 10 },
	brevo: { perSecond: 100 },
	postmark: { perSecond: 10 },
	nodemailer: { perSecond: 5 },
	emailserviceviewer: { perSecond: 1000 },
	emailserviceviewerlocal: { perSecond: 1000 },
}

/**
 * Token bucket minimal, in-memory, **par instance**. Chaque instance
 * `EmailServiceSelector` créée par le consommateur a son propre bucket :
 * pas de synchronisation cross-process, pas de persistance. Au redémarrage,
 * le bucket repart plein.
 *
 * Algorithme :
 * - capacity tokens au démarrage (autorise un petit burst initial)
 * - refill continu à `rate` tokens/s (calcul paresseux à chaque acquire)
 * - acquire() attend le temps nécessaire si aucun token dispo, via setTimeout
 *   (zéro CPU spin)
 *
 * Retourne le nombre de ms attendues — utile pour le logger.
 */
export class TokenBucket {
	private tokens: number
	private lastRefill: number

	constructor(private readonly rate: number, private readonly capacity: number) {
		if (rate <= 0) throw new Error('TokenBucket: rate must be > 0')
		if (capacity <= 0) throw new Error('TokenBucket: capacity must be > 0')
		this.tokens = capacity
		this.lastRefill = Date.now()
	}

	private refill(): void {
		const now = Date.now()
		const elapsedSec = (now - this.lastRefill) / 1000
		if (elapsedSec <= 0) return
		this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.rate)
		this.lastRefill = now
	}

	async acquire(): Promise<number> {
		this.refill()
		if (this.tokens >= 1) {
			this.tokens -= 1
			return 0
		}
		const waitSec = (1 - this.tokens) / this.rate
		const waitMs = Math.ceil(waitSec * 1000)
		await new Promise((resolve) => setTimeout(resolve, waitMs))
		this.refill()
		this.tokens -= 1
		return waitMs
	}
}

/**
 * Compose plusieurs token buckets — utile quand on veut cumuler
 * `perSecond` et `perMinute`. `acquire()` attend sur le bucket le plus
 * restrictif.
 */
export class CompositeBucket {
	constructor(private readonly buckets: TokenBucket[]) {}

	async acquire(): Promise<number> {
		const waits = await Promise.all(this.buckets.map((b) => b.acquire()))
		return Math.max(...waits)
	}
}

/**
 * Construit un rate limiter à partir d'un `Config`. Retourne `null` si
 * aucun rate limit n'est applicable (ne devrait pas arriver avec les
 * défauts embarqués, sauf ESP inconnu).
 */
export function createRateLimiter(
	esp: ESPName,
	override?: RateLimitConfig,
): TokenBucket | CompositeBucket | null {
	const config = override ?? RATE_LIMIT_DEFAULTS[esp]
	if (!config) return null
	const buckets: TokenBucket[] = []
	if (typeof config.perSecond === 'number' && config.perSecond > 0) {
		buckets.push(new TokenBucket(config.perSecond, config.perSecond))
	}
	if (typeof config.perMinute === 'number' && config.perMinute > 0) {
		buckets.push(new TokenBucket(config.perMinute / 60, config.perMinute))
	}
	if (buckets.length === 0) return null
	if (buckets.length === 1) return buckets[0]!
	return new CompositeBucket(buckets)
}
