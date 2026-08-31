import { WebHookBounceInfo, WebHookStatus } from "../../types/email.type";

export const webHookStatus: { [key: string]: WebHookStatus } = {
	'email.delivered': 'DELIVERED',
	// Resend n'a qu'UN événement de rebond : la nature (définitive ou passagère)
	// se lit dans `data.bounce.type`, jamais dans le type d'événement. La valeur
	// ci-dessous n'est donc qu'un repli — `resolveBounce()` fait autorité dès
	// que la charge utile porte un bloc `bounce`.
	'email.bounced': 'SOFT_BOUNCE',
	'email.sent': 'SENDED',
	'email.opened': 'OPENED',
	'email.clicked': 'CLICKED',
	'email.complained': 'SPAM_COMPLAINT',
	'email.delivery_delayed': 'DELAYED'
}

/**
 * Types de rebond DÉFINITIFS annoncés par Resend (terminologie héritée d'AWS
 * SES). Tout le reste — `Transient`, `Temporary`, `Undetermined`, valeur
 * inconnue ou bloc absent — est traité comme passager : sur un doute, on ne
 * condamne pas une adresse.
 *
 * ⚠️ Resend documente `Temporary` mais émet `Transient` dans ses charges utiles
 * réelles (vérifié sur des webhooks de production le 2026-08-31). Les deux
 * graphies doivent rester acceptées : ne jamais durcir sur une seule.
 */
const PERMANENT_BOUNCE_TYPES = ['permanent']

/**
 * Déduit la nature d'un rebond Resend depuis `data.bounce`.
 *
 * Retourne `null` quand l'événement n'est pas un rebond exploitable, auquel cas
 * l'appelant conserve le mapping par type d'événement.
 */
export function resolveBounce(bounce: any): WebHookBounceInfo | null {
	if (!bounce || typeof bounce !== 'object') return null

	const rawType = typeof bounce.type === 'string' ? bounce.type : undefined
	const kind: 'hard' | 'soft' =
		rawType && PERMANENT_BOUNCE_TYPES.includes(rawType.toLowerCase()) ? 'hard' : 'soft'

	// `diagnosticCode` arrive en tableau (et peut contenir des entrées nulles).
	const diagnosticCode = Array.isArray(bounce.diagnosticCode)
		? bounce.diagnosticCode.filter((entry: unknown) => typeof entry === 'string' && entry.length > 0).join(' | ') || undefined
		: (typeof bounce.diagnosticCode === 'string' ? bounce.diagnosticCode : undefined)

	return {
		kind,
		type: rawType,
		subType: typeof bounce.subType === 'string' ? bounce.subType : undefined,
		diagnosticCode,
		message: typeof bounce.message === 'string' ? bounce.message : undefined,
	}
}
