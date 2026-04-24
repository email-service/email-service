
import type { WebHookResponse } from '../types/email.type.js'
import type { SuppressionReason } from '../types/bulk.type.js'

/**
 * Convertit une WebHookResponse normalisée (retournée par `webHookManagement`)
 * en entrée prête à persister dans une suppression list côté consommateur.
 *
 * Retourne `null` si l'event ne doit pas créer d'entrée (DELIVERED, OPENED,
 * CLICKED, SOFT_BOUNCE, erreur de parsing, etc.) — le consommateur peut
 * ignorer silencieusement.
 *
 * Mapping (aligné sur les WebHookStatus normalisés par la lib) :
 * - `HARD_BOUNCE` → `hard_bounce`
 * - `SPAM_COMPLAINT` / `SPAM` → `spam_complaint`
 * - `SUBSCRIPTION_CHANGE` → `unsubscribe_marketing` par défaut (conservative :
 *   on préserve le canal transactionnel). Si `metaData.stream === 'transactional'`
 *   est présent, on considère `unsubscribe_all` (le destinataire s'est
 *   désinscrit d'une notif transactionnelle, c'est qu'il ne veut plus rien).
 * - autres (DELIVERED, OPENED, CLICKED, SOFT_BOUNCE, DELAYED, REJECTED, …) → null
 */
export function normalizeSuppressionFromWebhook(
	response: WebHookResponse,
): { email: string; reason: SuppressionReason } | null {
	if (!response.success) return null
	const data = response.data
	const email = data.to
	if (!email) return null

	const reason = mapWebHookTypeToReason(data.webHookType, data.metaData)
	if (!reason) return null
	return { email, reason }
}

function mapWebHookTypeToReason(
	type: string,
	metaData?: object,
): SuppressionReason | null {
	switch (type) {
		case 'HARD_BOUNCE':
			return 'hard_bounce'
		case 'SPAM_COMPLAINT':
		case 'SPAM':
			return 'spam_complaint'
		case 'SUBSCRIPTION_CHANGE': {
			const stream = readStream(metaData)
			if (stream === 'transactional') return 'unsubscribe_all'
			return 'unsubscribe_marketing'
		}
		default:
			return null
	}
}

function readStream(metaData: object | undefined): string | undefined {
	if (!metaData || typeof metaData !== 'object') return undefined
	const value = (metaData as Record<string, unknown>).stream
	return typeof value === 'string' ? value : undefined
}
