
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
