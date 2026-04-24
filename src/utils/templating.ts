
/**
 * Handlebars minimal pour l'interpolation de variables dans un template
 * (subject / html / text). Stateless, pas de dépendance runtime.
 *
 * Supporté en v1 :
 * - `{{var}}` : remplacement simple, échappé HTML par défaut
 * - `{{object.property}}` : dotted path (profondeur illimitée)
 * - `{{{var}}}` : remplacement sans échappement (opt-out pour les cas de HTML
 *   déjà formé — à utiliser uniquement sur des valeurs de confiance)
 *
 * Non supporté (à ajouter en v2 si besoin) :
 * - `{{#each collection}}...{{/each}}`
 * - `{{#if cond}}...{{/if}}`
 * - Helpers personnalisés
 *
 * Comportement sur var absente / undefined / null : remplacée par la chaîne
 * vide (aucune erreur levée).
 */

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch)
}

function resolvePath(vars: Record<string, unknown>, path: string): unknown {
	const parts = path.split('.')
	let current: unknown = vars
	for (const part of parts) {
		if (current === null || current === undefined) return undefined
		if (typeof current !== 'object') return undefined
		current = (current as Record<string, unknown>)[part]
	}
	return current
}

function stringify(value: unknown): string {
	if (value === null || value === undefined) return ''
	if (typeof value === 'string') return value
	if (typeof value === 'number' || typeof value === 'boolean') return String(value)
	// Objets / arrays : JSON.stringify de secours, préférable à "[object Object]"
	try {
		return JSON.stringify(value)
	} catch {
		return ''
	}
}

export function renderTemplate(
	template: string,
	vars: Record<string, unknown>,
): string {
	// Triple-accolade (raw, pas d'échappement) — traité en premier pour que les
	// remplacements bruts ne soient pas ré-échappés derrière.
	const rawReplaced = template.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, path) => {
		return stringify(resolvePath(vars, path))
	})
	return rawReplaced.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
		return escapeHtml(stringify(resolvePath(vars, path)))
	})
}
