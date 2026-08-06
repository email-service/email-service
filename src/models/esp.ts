import { EmailPayload, FromInput, IEmailService, NormalizedEmailPayload, Recipient, RecipientInput, StandardResponse, WebHookResponse } from "../types/email.type.js"
import type { Config } from "../types/emailServiceSelector.type.js"
import type { InboundResponse } from "../types/inbound.type.js"
import type { BulkPayload, BulkReport, EmailServiceHooks } from "../types/bulk.type.js"
import { normalizeFrom, normalizeRecipients } from "../utils/normalizeEmailRecipients.js"
import { createRateLimiter, TokenBucket, CompositeBucket } from "../utils/rateLimit.js"
import { runBulk } from "../utils/bulkRunner.js"
import { normalizePayload } from "../utils/normalizePayload.js"

export type ESPOptions = {
	/**
	 * Hooks optionnels branchés sur l'instance. Utilisés exclusivement par
	 * `sendBulk` pour la suppression list + observabilité campagne. Si
	 * absents, `sendBulk` fonctionne quand même (aucun check, aucun callback).
	 */
	hooks?: EmailServiceHooks
}

export class ESP<T extends Config> implements IEmailService {

	mailMultiple?: boolean = false

	transporter: T

	/**
	 * Rate limiter scopé par instance. Acquis avant chaque `sendMail`
	 * pour éviter que le consommateur déclenche des 429 côté ESP.
	 * `null` uniquement pour un ESP inconnu (ne devrait pas arriver).
	 */
	protected rateLimiter: TokenBucket | CompositeBucket | null

	/**
	 * Hooks fournis à l'instanciation. Consommés par `sendBulk`. `sendMail`
	 * unitaire ne les utilise pas — c'est une décision : les hooks sont liés
	 * au contexte campagne, pas aux appels transactionnels unitaires.
	 */
	protected hooks?: EmailServiceHooks

	constructor(service: T, opts?: ESPOptions) {
		this.transporter = service
		this.rateLimiter = createRateLimiter(service.esp, service.rateLimit)
		this.hooks = opts?.hooks
		if (this.transporter.logger) console.log('******** ES ********  New Instance of ', this.transporter.esp)
	}

	checkRecipients(to: RecipientInput): Recipient[] {
		return normalizeRecipients(to)
	}

	checkFrom(from: FromInput): Recipient | undefined {
		return normalizeFrom(from)
	}

	/**
	 * Envoi public : normalise le payload, applique le rate limit, puis délègue
	 * à `doSendMail` implémenté par chaque ESP concret (template method). Les
	 * ESP concrets ne doivent PAS override `sendMail` directement, sinon ils
	 * contourneraient le throttle ET la normalisation.
	 *
	 * La normalisation précède le rate limit à dessein : un payload invalide
	 * échoue immédiatement plutôt que de consommer un jeton du seau.
	 */
	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		const normalized = normalizePayload(options)
		if (normalized.error) {
			if (this.transporter.logger) console.log('******** ES ******** payload invalide', normalized.error.error)
			return normalized.error
		}

		if (this.rateLimiter) {
			const waited = await this.rateLimiter.acquire()
			if (waited > 0 && this.transporter.logger) {
				console.log(`******** ES ******** rate limited ${this.transporter.esp}, waited ${waited}ms`)
			}
		}
		return this.doSendMail(normalized.payload!)
	}

	/**
	 * Envoi en lot avec suppression list, stream (transactional|marketing),
	 * templating par destinataire et hooks de persistance.
	 *
	 * Implémentation unique sur la classe de base — réutilise `sendMail()`
	 * pour chaque destinataire, ce qui fait bénéficier chaque envoi du
	 * rate limit automatiquement.
	 *
	 * Les règles de blocage (transactional vs marketing) sont appliquées
	 * par `runBulk` en interne — le consommateur implémente juste un
	 * `checkSuppression` qui retourne la reason brute.
	 */
	async sendBulk(payload: BulkPayload): Promise<BulkReport> {
		return runBulk(payload, this.hooks, (p) => this.sendMail(p))
	}

	/**
	 * À implémenter par chaque ESP concret. Reçoit un payload DÉJÀ normalisé :
	 * adresses garanties en `Recipient`, `replyTo` résolu, en-têtes nettoyés.
	 */
	protected async doSendMail(options: NormalizedEmailPayload): Promise<StandardResponse> {
		return ({ success: false, status: 500, error: { name: 'NO_METHOD_sendMail', message: 'This function do never to be call, contact the developper' } })
	}

	async webHookManagement(req: any): Promise<WebHookResponse> {
		return ({ success: false, status: 500, error: { name: 'NO_METHOD_webHookManagement', message: 'This function do never to be call, contact the developper' } })
	}

	/**
	 * Réception d'un message entrant. Défaut : non supporté — un ESP sans
	 * réception le déclare ainsi, et en ajouter un ne casse rien (même motif que
	 * `webHookManagement`).
	 *
	 * `config` n'est utile qu'aux ESP en deux temps (Resend), dont le webhook ne
	 * porte que des métadonnées et qui exigent une clé API pour le reste.
	 */
	async inboundManagement(req: any, config?: Config): Promise<InboundResponse> {
		return ({ success: false, status: 501, error: { name: 'INBOUND_NOT_SUPPORTED', message: `Inbound reception is not supported for ${this.transporter?.esp ?? 'this ESP'}` } })
	}

	async sendMailMultiple(options: EmailPayload[]): Promise<StandardResponse[]> {
		return ([{ success: false, status: 500, error: { name: 'NO_METHOD_sendMail', message: 'This function do never to be call, contact the developper' } }])
	}
}
