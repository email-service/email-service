
import type { EmailPayload, HeadersPayLoad } from '../types/email.type.js'

/**
 * Injecte les headers RFC 8058 de désinscription dans un EmailPayload.
 *
 * Pose :
 * - `List-Unsubscribe: <https://...>` (et éventuellement `<mailto:...>`)
 * - `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
 *
 * Helper pur et immutable : retourne un nouveau payload sans muter l'entrée.
 * Si des headers `List-Unsubscribe*` existaient déjà dans le payload, ils
 * sont remplacés.
 *
 * Usage typique : envoi marketing unitaire (sendMail), pour lequel on veut
 * le comportement compliance sans passer par sendBulk. Pour les campagnes
 * sendBulk, l'injection est automatique dès que `stream: 'marketing'`.
 *
 * @param payload  L'EmailPayload source (non muté).
 * @param url      L'URL de désinscription du destinataire.
 * @param mailto   Adresse mailto optionnelle (ex: unsubscribe@mon-domaine.com)
 *                 — si fournie, ajoutée en premier dans `List-Unsubscribe`.
 */
export function injectUnsubscribeHeader(
	payload: EmailPayload,
	url: string,
	mailto?: string,
): EmailPayload {
	const existingHeaders: HeadersPayLoad = payload.headers ?? []
	// Retire tout header de désinscription pré-existant (override).
	const filtered = existingHeaders.filter(
		(h) =>
			h.name !== 'List-Unsubscribe' &&
			h.name !== 'List-Unsubscribe-Post',
	)
	const listUnsubValue = mailto
		? `<mailto:${mailto}>, <${url}>`
		: `<${url}>`
	const nextHeaders: HeadersPayLoad = [
		...filtered,
		{ name: 'List-Unsubscribe', value: listUnsubValue },
		{ name: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' },
	]
	return { ...payload, headers: nextHeaders }
}
