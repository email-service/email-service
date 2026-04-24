
import type { FromInput, StandardResponse } from './email.type.js'
import type { StandardError, ESPStandardizedError } from './error.type.js'

/**
 * Raison pour laquelle un email est inscrit dans la suppression list du
 * consommateur.
 *
 * - `hard_bounce` : l'adresse est invalide / n'existe pas. Blocage permanent,
 *   non retirable.
 * - `spam_complaint` : le destinataire a marqué l'email comme spam.
 * - `unsubscribe_marketing` : le destinataire s'est désinscrit du canal
 *   marketing (via lien List-Unsubscribe ou formulaire). Les transactionnels
 *   restent autorisés.
 * - `unsubscribe_all` : désinscription totale, y compris transactionnels.
 */
export type SuppressionReason =
	| 'hard_bounce'
	| 'spam_complaint'
	| 'unsubscribe_marketing'
	| 'unsubscribe_all'

/**
 * Stream d'envoi. Oriente le comportement (compliance, headers, règles de
 * suppression), pas la volumétrie.
 */
export type EmailStream = 'transactional' | 'marketing'

/**
 * Destinataire unitaire d'un envoi bulk. `mergeVars` permettent
 * l'interpolation `{{user.firstName}}` dans le subject/html/text via
 * `renderTemplate` de la lib.
 */
export type BulkRecipient = {
	email: string
	name?: string
	mergeVars?: Record<string, unknown>
}

/**
 * Template commun du batch. `text` est optionnel — s'il est absent, la lib
 * le dérive automatiquement de `html` via `stripHtml`.
 */
export type BulkTemplate = {
	subject: string
	html: string
	text?: string
}

/**
 * Hooks optionnels branchés sur l'instance `ESP`. Permettent au consommateur
 * d'implémenter sa suppression list / persistance sans que la lib connaisse
 * son storage.
 *
 * - `checkSuppression` : retourne une `SuppressionReason` si l'email doit être
 *   skip, `null` sinon. La lib applique la règle (selon `stream`) au retour :
 *   - transactional bloque sur `hard_bounce` et `unsubscribe_all`
 *   - marketing bloque en plus sur `spam_complaint` et `unsubscribe_marketing`
 *   Le consommateur peut simplifier en retournant toujours la reason brute —
 *   la lib décide selon le stream si elle bloque ou non.
 *
 * - `onSent` / `onSkipped` / `onFailed` : notifications post-tentative. Le
 *   consommateur les utilise typiquement pour alimenter une collection
 *   `emailEvents` et agréger par `campaignId`.
 */
export type EmailServiceHooks = {
	checkSuppression?: (
		email: string,
		context: { stream: EmailStream; campaignId?: string },
	) => Promise<SuppressionReason | null>

	onSent?: (
		email: string,
		response: StandardResponse,
		campaignId?: string,
	) => Promise<void>

	onSkipped?: (
		email: string,
		reason: SuppressionReason,
		campaignId?: string,
	) => Promise<void>

	onFailed?: (
		email: string,
		error: StandardError | ESPStandardizedError,
		campaignId?: string,
	) => Promise<void>
}

type BulkPayloadCommon = {
	campaignId: string
	recipients: BulkRecipient[]
	template: BulkTemplate
	from: FromInput
	metadata?: Record<string, unknown>
}

/** Payload bulk en mode transactionnel — pas d'unsubscribeUrl. */
export type BulkPayloadTransactional = BulkPayloadCommon & {
	stream: 'transactional'
}

/**
 * Payload bulk en mode marketing — `unsubscribeUrl` **obligatoire** et fourni
 * sous forme de fonction pour générer un URL par destinataire (one-click
 * typiquement avec un token distinct).
 */
export type BulkPayloadMarketing = BulkPayloadCommon & {
	stream: 'marketing'
	unsubscribeUrl: (email: string) => string
}

export type BulkPayload = BulkPayloadTransactional | BulkPayloadMarketing

/**
 * Rapport synthétique retourné par `sendBulk`. Tout est en mémoire — la
 * persistance durable (events, stats campagne) se fait via les hooks.
 */
export type BulkReport = {
	campaignId: string
	sent: number
	skipped: Array<{ email: string; reason: SuppressionReason }>
	failed: Array<{ email: string; error: StandardError | ESPStandardizedError }>
	startedAt: string
	endedAt: string
	durationMs: number
}
