import type { HeadersPayLoad } from "../types/email.type.js";

/**
 * Retire des en-têtes personnalisés ceux dont le nom figure dans `names`.
 *
 * La comparaison est **insensible à la casse** : les noms de champs d'en-tête
 * le sont au sens de la RFC 5322 §2.2, donc `reply-to`, `Reply-To` et
 * `REPLY-TO` désignent le même champ. Une comparaison stricte laisserait
 * passer un doublon dès que l'appelant n'écrit pas la casse canonique.
 *
 * Helper pur : retourne un nouveau tableau, n'altère pas l'entrée.
 *
 * @param headers En-têtes source (peut être `undefined`).
 * @param names   Noms à retirer, dans n'importe quelle casse.
 */
export function stripHeaders(headers: HeadersPayLoad | undefined, names: string[]): HeadersPayLoad {
	if (!headers || headers.length === 0) return []
	const toRemove = new Set(names.map(n => n.toLowerCase()))
	return headers.filter(h => !toRemove.has(h.name.toLowerCase()))
}

/**
 * Convertit les en-têtes en objet clé/valeur — format attendu par Brevo et
 * Resend (`{ "X-Custom": "valeur" }`).
 *
 * En cas de noms en double, la dernière valeur l'emporte : un objet JSON ne
 * peut pas porter deux fois la même clé.
 */
export function toRecordHeaders(headers: HeadersPayLoad | undefined): Record<string, string> {
	if (!headers) return {}
	return headers.reduce((acc, header) => {
		acc[header.name] = header.value;
		return acc;
	}, {} as Record<string, string>);
}

/**
 * Convertit les en-têtes au format Postmark : un tableau d'objets dont les clés
 * sont en Pascal (`[{ "Name": …, "Value": … }]`).
 *
 * ⚠️ Postmark n'accepte QUE cette casse. Jusqu'à la v0.6.2 la librairie lui
 * transmettait le tableau `{ name, value }` interne tel quel : aucun en-tête
 * personnalisé n'atteignait donc Postmark, `List-Unsubscribe` compris.
 */
export function toPostmarkHeaders(headers: HeadersPayLoad | undefined): { Name: string, Value: string }[] | undefined {
	if (!headers || headers.length === 0) return undefined
	return headers.map(h => ({ Name: h.name, Value: h.value }))
}
