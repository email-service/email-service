import type { Recipient } from "../types/email.type.js";
import { normalizeFrom, normalizeRecipients } from "./normalizeEmailRecipients.js";
import { parseReferences } from "./parseHeaders.js";

/**
 * Helpers partagés par les adaptateurs de réception. Chaque ESP livre les
 * adresses dans une forme différente (chaîne, objet `{Name, Address}`, tableau
 * de chaînes) ; tout converge ici vers `Recipient`.
 */

/** Adresse unique. `undefined` plutôt qu'un objet vide si rien d'exploitable. */
export function toRecipient(value: any): Recipient | undefined {
	if (!value) return undefined
	// Forme Brevo : { Name, Address }
	if (typeof value === 'object' && 'Address' in value) {
		return { name: value.Name || undefined, email: value.Address }
	}
	// Forme Postmark : { Email, Name }
	if (typeof value === 'object' && 'Email' in value) {
		return { name: value.Name || undefined, email: value.Email }
	}
	if (typeof value === 'object' && 'email' in value) {
		return { name: value.name || undefined, email: value.email }
	}
	if (typeof value === 'string') return normalizeFrom(value)
	return undefined
}

/** Liste d'adresses, toutes formes confondues. */
export function toRecipients(value: any): Recipient[] {
	if (!value) return []
	if (Array.isArray(value)) {
		return value.map(toRecipient).filter((r): r is Recipient => !!r)
	}
	if (typeof value === 'string') return normalizeRecipients(value)
	const single = toRecipient(value)
	return single ? [single] : []
}

/**
 * Normalise un jeu d'en-têtes vers `Record<string, string>`, noms en minuscules,
 * occurrences multiples jointes par `, `.
 *
 * Accepte les deux formes rencontrées : le tableau `[{Name, Value}]` de Postmark
 * et l'objet de Brevo — dont les valeurs peuvent être des **tableaux** quand
 * l'en-tête apparaît plusieurs fois (`References`, typiquement).
 */
export function normalizeInboundHeaders(input: any): Record<string, string> {
	const headers: Record<string, string> = {}
	if (!input) return headers

	const add = (rawName: string, rawValue: any) => {
		const name = String(rawName).trim().toLowerCase()
		const value = Array.isArray(rawValue)
			? rawValue.map(v => String(v).trim()).join(', ')
			: String(rawValue).trim()
		headers[name] = headers[name] ? `${headers[name]}, ${value}` : value
	}

	if (Array.isArray(input)) {
		for (const h of input) {
			if (h && h.Name !== undefined) add(h.Name, h.Value)
			else if (h && h.name !== undefined) add(h.name, h.value)
		}
		return headers
	}

	for (const [name, value] of Object.entries(input)) add(name, value)
	return headers
}

/**
 * Extrait `inReplyTo` et `references` d'un jeu d'en-têtes normalisé.
 *
 * `references` inclut `inReplyTo` s'il n'y figure pas déjà : certains clients
 * n'envoient que `In-Reply-To`, et un consommateur qui ne regarderait que
 * `references` perdrait le rattachement.
 */
export function extractThreading(headers: Record<string, string>): { inReplyTo?: string, references?: string[] } {
	const inReplyTo = headers['in-reply-to'] || undefined
	const references = parseReferences(headers['references'])

	if (inReplyTo && !references.includes(inReplyTo)) references.push(inReplyTo)

	return {
		inReplyTo,
		references: references.length > 0 ? references : undefined,
	}
}
