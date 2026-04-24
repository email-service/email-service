
/**
 * Dérive une version texte plaine depuis du HTML, pour remplir automatiquement
 * le champ `text` d'un email quand le caller ne l'a pas fourni.
 *
 * Ce n'est PAS un convertisseur HTML→Markdown. Règles v1 :
 * - Les balises `<br>`, `<br/>`, `<br />` deviennent un retour à la ligne
 * - Les fermetures de blocs (`</p>`, `</div>`, `</h1-6>`, `</li>`, `</tr>`)
 *   deviennent un retour à la ligne
 * - Les autres balises sont supprimées
 * - Les entités HTML courantes (`&nbsp;`, `&amp;`, `&lt;`, `&gt;`, `&quot;`,
 *   `&#39;`) sont décodées
 * - Les lignes vides multiples sont compactées (max 2 sauts de ligne consécutifs)
 * - Les espaces en début/fin de ligne sont trimés
 *
 * Insuffisant si le HTML contient des liens importants (perte de l'URL) —
 * dans ce cas, le caller doit fournir explicitement `text`.
 */
export function stripHtml(html: string): string {
	if (!html) return ''

	// Convertir <br> en retour à la ligne
	let out = html.replace(/<br\s*\/?>/gi, '\n')

	// Convertir la fermeture des blocs en retour à la ligne
	out = out.replace(/<\/(p|div|h[1-6]|li|tr|table|blockquote)>/gi, '\n')

	// Supprimer toutes les autres balises
	out = out.replace(/<[^>]+>/g, '')

	// Décoder quelques entités courantes
	out = out
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")

	// Normaliser les retours à la ligne : trim par ligne, max 2 sauts consécutifs
	out = out
		.split('\n')
		.map((line) => line.trim())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()

	return out
}
