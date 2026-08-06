import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Vérification de la signature d'un webhook de réception.
 *
 * ⚠️ **Le corps doit être le corps BRUT, non parsé.** C'est l'erreur classique :
 * le framework a déjà transformé la requête en objet, un `JSON.stringify` de cet
 * objet ne redonne pas les octets d'origine (ordre des clés, espaces, échappement
 * des caractères non-ASCII), et la signature ne correspond plus. Côté Hono :
 * `await c.req.text()` AVANT tout `c.req.json()`.
 *
 * À appeler **avant** `getInboundEmail`, jamais après : un message non
 * authentifié ne doit pas être traité du tout.
 */
export type InboundSignatureResult = {
	valid: boolean
	/** Renseigné quand la vérification n'a pas pu avoir lieu. */
	reason?: string
}

/**
 * @param esp     Nom de l'ESP (`resend`, `postmark`, `brevo`, viewer).
 * @param headers En-têtes de la requête entrante (noms insensibles à la casse).
 * @param rawBody Corps BRUT de la requête, tel qu'il est arrivé.
 * @param secret  Secret de signature configuré chez l'ESP.
 */
export function verifyInboundSignature(
	esp: string,
	headers: Record<string, string | undefined>,
	rawBody: string,
	secret: string,
): InboundSignatureResult {
	if (!secret) return { valid: false, reason: 'NO_SECRET_PROVIDED' }

	const get = (name: string): string | undefined => {
		const key = Object.keys(headers).find(h => h.toLowerCase() === name)
		return key ? headers[key] : undefined
	}

	switch (esp) {
		case 'resend':
			return verifySvix(get, rawBody, secret)

		case 'postmark':
		case 'brevo':
			// Ni Postmark ni Brevo ne signent leurs webhooks : ils protègent
			// l'endpoint par une authentification basique ou un jeton dans l'URL.
			// Le renvoyer en « non applicable » plutôt qu'en « valide » évite de
			// laisser croire à une vérification qui n'a pas eu lieu.
			return { valid: false, reason: 'SIGNATURE_NOT_SUPPORTED_USE_URL_TOKEN_OR_BASIC_AUTH' }

		case 'emailserviceviewer':
		case 'emailserviceviewerlocal':
			return { valid: false, reason: 'SIGNATURE_NOT_SUPPORTED_LOCAL_VIEWER' }

		default:
			return { valid: false, reason: 'UNKNOWN_ESP' }
	}
}

/**
 * Schéma Svix, utilisé par Resend : HMAC-SHA256 de `{id}.{timestamp}.{body}`,
 * clé secrète en base64 après le préfixe `whsec_`.
 *
 * L'en-tête `svix-signature` peut contenir PLUSIEURS signatures séparées par des
 * espaces (rotation de secret) : il suffit qu'une seule corresponde.
 */
function verifySvix(
	get: (name: string) => string | undefined,
	rawBody: string,
	secret: string,
): InboundSignatureResult {
	const id = get('svix-id')
	const timestamp = get('svix-timestamp')
	const signature = get('svix-signature')

	if (!id || !timestamp || !signature) return { valid: false, reason: 'MISSING_SVIX_HEADERS' }

	const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
	const expected = createHmac('sha256', key)
		.update(`${id}.${timestamp}.${rawBody}`)
		.digest('base64')

	const candidates = signature
		.split(' ')
		.map(part => part.includes(',') ? part.split(',')[1] : part)
		.filter(Boolean)

	const valid = candidates.some(candidate => safeEqual(candidate, expected))
	return valid ? { valid: true } : { valid: false, reason: 'SIGNATURE_MISMATCH' }
}

/** Comparaison à temps constant — une comparaison naïve fuit le secret. */
function safeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a)
	const bufB = Buffer.from(b)
	if (bufA.length !== bufB.length) return false
	return timingSafeEqual(bufA, bufB)
}
