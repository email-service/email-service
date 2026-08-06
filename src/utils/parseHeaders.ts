/**
 * Extraction des en-têtes d'un message MIME brut.
 *
 * Volontairement limité aux en-têtes : le corps est fourni par l'ESP (API ou
 * webhook), on ne cherche donc jamais à décoder le MIME. Cela suffit à récupérer
 * `Message-ID`, `In-Reply-To`, `References` et `Reply-To` — les seuls champs que
 * certains fournisseurs (Resend) ne donnent pas autrement.
 *
 * Deux règles de la RFC 5322 sont respectées, et elles ne sont pas optionnelles
 * en pratique :
 *
 * - **§2.2.3 dépliage** : une valeur peut courir sur plusieurs lignes, les
 *   suivantes commençant par une espace ou une tabulation. `References` en
 *   profite presque toujours — le lire ligne à ligne perdrait la moitié du fil.
 * - **§2.1 séparation** : la première ligne vide termine les en-têtes. Tout ce
 *   qui suit est le corps et ne doit pas être analysé.
 *
 * Les noms sont normalisés en minuscules (§2.2 : ils sont insensibles à la
 * casse) et les occurrences multiples jointes par `, `.
 */
export function parseRawHeaders(raw: string): Record<string, string> {
	const headers: Record<string, string> = {}
	if (!raw) return headers

	// Normalise les fins de ligne : un message peut arriver en CRLF ou LF selon
	// le chemin qu'il a suivi.
	const lines = raw.replace(/\r\n/g, '\n').split('\n')

	let currentName: string | undefined
	let currentValue = ''

	const flush = () => {
		if (!currentName) return
		const value = currentValue.trim()
		headers[currentName] = headers[currentName]
			? `${headers[currentName]}, ${value}`
			: value
		currentName = undefined
		currentValue = ''
	}

	for (const line of lines) {
		// Ligne vide → fin de la section d'en-têtes.
		if (line === '') break

		// Ligne de continuation (dépliage) : rattachée à l'en-tête courant.
		if (/^[ \t]/.test(line)) {
			if (currentName) currentValue += ' ' + line.trim()
			continue
		}

		const separator = line.indexOf(':')
		// Ligne sans séparateur : message malformé ou ligne « From  » d'une
		// mbox. On l'ignore plutôt que de produire un en-tête bancal.
		if (separator === -1) continue

		flush()
		currentName = line.slice(0, separator).trim().toLowerCase()
		currentValue = line.slice(separator + 1)
	}
	flush()

	return headers
}

/**
 * Découpe un en-tête `References` (ou `In-Reply-To` multiple) en identifiants.
 *
 * Les identifiants sont séparés par des espaces — et par des virgules une fois
 * passés par `parseRawHeaders`, qui joint les occurrences multiples.
 */
export function parseReferences(value: string | undefined): string[] {
	if (!value) return []
	return value
		.split(/[\s,]+/)
		.map(v => v.trim())
		.filter(v => v.length > 0)
}
