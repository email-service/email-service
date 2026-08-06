import type { EmailPayload, NormalizedEmailPayload, StandardResponse } from "../types/email.type.js";
import { normalizeFrom, normalizeRecipients } from "./normalizeEmailRecipients.js";
import { stripHeaders } from "./headers.js";

/**
 * En-têtes que la librairie pose elle-même à partir d'un champ dédié du
 * payload. Ils sont systématiquement retirés des en-têtes personnalisés : sans
 * ça, l'ESP recevrait deux sources concurrentes pour le même champ et le
 * message pourrait partir avec deux occurrences — ce que la RFC 5322 interdit
 * (le champ apparaît au plus une fois) et dont le rendu dépendrait du client de
 * messagerie.
 *
 * `List-Unsubscribe*` n'y figure pas : ces en-têtes n'ont pas de champ dédié et
 * sont gérés en amont par `injectUnsubscribeHeader`, qui fait son propre
 * remplacement.
 */
const LIBRARY_OWNED_HEADERS = ['Reply-To']

/**
 * Exactement l'un des deux champs est renseigné.
 *
 * Forme volontairement non discriminée (plutôt qu'une union `ok: true|false`) :
 * le projet ne compile pas en `strict`, et sans `strictNullChecks` TypeScript
 * ne réduit pas une union sur un discriminant booléen — le code appelant
 * n'aurait accès à aucun des deux champs.
 */
export type NormalizeResult = {
	payload?: NormalizedEmailPayload
	error?: Extract<StandardResponse, { success: false }>
}

/**
 * Normalise un `EmailPayload` avant remise à un adaptateur ESP.
 *
 * Fait en UN SEUL endroit ce que chaque adaptateur faisait — ou oubliait de
 * faire — pour son compte :
 *
 * - `from`, `to`, `cc`, `bcc` deviennent des objets `Recipient` : un adaptateur
 *   n'a plus à se demander si l'appelant a fourni une chaîne. Avant la v0.6.2,
 *   seul Resend appelait `checkFrom` ; Postmark et le viewer castaient
 *   (`options.from as Recipient`) et produisaient `From: undefined` sur une
 *   chaîne nue, Brevo transmettait la valeur brute là où son API attend un objet.
 * - `replyTo` est résolu (`replyTo ?? from`) une fois pour toutes.
 * - les en-têtes portés par la librairie sont retirés des en-têtes personnalisés.
 *
 * Appelée par `ESP.sendMail()` — donc aussi par `sendBulk()` qui repasse par
 * lui — et explicitement par `PostMarkEmailService.sendMailMultiple()`, seul
 * chemin d'envoi qui ne traverse pas `sendMail`.
 */
export function normalizePayload(options: EmailPayload): NormalizeResult {
	const from = normalizeFrom(options.from)
	if (!from) {
		return {
			error: {
				success: false, status: 400,
				error: { name: 'FROM_REQUIRED', category: 'PARAM_INVALID', cause: { reason: 'from is missing or invalid' } }
			}
		}
	}

	const to = normalizeRecipients(options.to)
	if (to.length === 0) {
		return {
			error: {
				success: false, status: 400,
				error: { name: 'TO_REQUIRED', category: 'PARAM_INVALID', cause: { reason: 'to is missing or invalid' } }
			}
		}
	}

	// `replyTo` absent → adresse d'expédition : c'est le comportement historique,
	// aucun appelant existant n'est modifié.
	const replyTo = options.replyTo ? normalizeFrom(options.replyTo) : from
	if (!replyTo) {
		return {
			error: {
				success: false, status: 400,
				error: { name: 'REPLY_TO_INVALID', category: 'PARAM_INVALID', cause: { reason: 'replyTo is invalid' } }
			}
		}
	}

	return {
		payload: {
			...options,
			from,
			replyTo,
			to,
			cc: options.cc ? normalizeRecipients(options.cc) : undefined,
			bcc: options.bcc ? normalizeRecipients(options.bcc) : undefined,
			headers: stripHeaders(options.headers, LIBRARY_OWNED_HEADERS),
		}
	}
}
