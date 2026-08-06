import { WebHookStatus } from "../../types/email.type";

/**
 * Correspondance entre ce qu'émet le viewer et les statuts normalisés.
 *
 * Deux familles de clés cohabitent volontairement :
 *
 * - **Noms canoniques** — le viewer émet désormais directement les valeurs de
 *   `WebHookStatus`. C'est ce qui permet de simuler les onze statuts, là où la
 *   table historique n'en couvrait que cinq : ni rebond dur, ni rejeté, ni
 *   différé, ni changement d'abonnement n'étaient atteignables, et `BOUNCE`
 *   était mappé en dur sur `SOFT_BOUNCE`.
 * - **Alias historiques** — conservés parce que des viewers déjà déployés
 *   continuent de les émettre : une montée de version de la librairie ne doit
 *   pas les casser. `LINK_CLICK` en fait partie et n'y figurait PAS, si bien que
 *   l'événement « lien cliqué » était rejeté en `NO_STATUS_FOR_WEBHOOK` — c'est
 *   pourtant sous ce nom que le viewer l'émet depuis toujours.
 */
export const webHookStatus: { [key: string]: WebHookStatus } = {
	// Noms canoniques
	SENDED: 'SENDED',
	DELAYED: 'DELAYED',
	DELIVERED: 'DELIVERED',
	OPENED: 'OPENED',
	CLICKED: 'CLICKED',
	SPAM_COMPLAINT: 'SPAM_COMPLAINT',
	SPAM: 'SPAM',
	SOFT_BOUNCE: 'SOFT_BOUNCE',
	HARD_BOUNCE: 'HARD_BOUNCE',
	SUBSCRIPTION_CHANGE: 'SUBSCRIPTION_CHANGE',
	REJECTED: 'REJECTED',

	// Alias historiques
	DELIVERY: 'DELIVERED',
	BOUNCE: 'SOFT_BOUNCE',
	OPEN: 'OPENED',
	LINK: 'CLICKED',
	LINK_CLICK: 'CLICKED',
}
