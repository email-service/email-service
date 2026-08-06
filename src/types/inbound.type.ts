import type { Recipient } from "./email.type.js";
import type { ESPStandardizedError, StandardError } from "./error.type.js";

/**
 * Réception d'un message entrant — à ne pas confondre avec les webhooks
 * d'ÉVÉNEMENTS (`WebHookResponse`) :
 *
 * - événement  = « ton message a été délivré / ouvert / rejeté »
 * - réception  = « un message est arrivé pour toi »
 *
 * ⚠️ Les deux natures arrivent avec le MÊME `User-Agent` chez un même ESP
 * (Postmark utilise le sien pour les deux, Resend passe par Svix dans les deux
 * cas). C'est donc l'endpoint appelé qui les distingue, jamais l'agent : le
 * consommateur expose deux routes, l'une appelant `getWebHook`, l'autre
 * `getInboundEmail`.
 */
export type InboundResponse =
	| { success: true; status: number; data: InboundMessage[]; espData?: any }
	| { success: false; status: number; error: StandardError | ESPStandardizedError }

export type InboundMessage = {
	/** Message-ID RFC du message reçu. Clé de déduplication, toujours renseignée. */
	messageId: string
	/** Identifiant du message chez l'ESP (pour ses API : pièces jointes, brut). */
	espMessageId?: string

	/**
	 * Rattachement au fil de discussion — c'est PAR EUX que le consommateur
	 * relie une réponse à l'envoi d'origine, donc au dossier et au client. Tout
	 * adaptateur doit les remonter, quitte à les extraire du message brut.
	 */
	inReplyTo?: string
	references?: string[]
	/**
	 * Adresses auxquelles le message est RÉELLEMENT arrivé — clé de routage
	 * quand `inReplyTo` est absent (le consommateur y encode l'utilisateur, par
	 * exemple `{user}@{agence}.exemple.com`).
	 *
	 * Tableau et non chaîne : Resend expose plusieurs adresses, extraites de la
	 * clause `for` des en-têtes `Received`. À ne pas confondre avec `to`, qui
	 * peut contenir des copies ou une liste.
	 */
	receivedFor?: string[]

	from: Recipient
	to: Recipient[]
	cc?: Recipient[]
	replyTo?: Recipient
	subject: string
	html?: string
	text?: string
	/** Réponse isolée du fil cité, quand l'ESP sait la produire. */
	strippedTextReply?: string

	/**
	 * En-têtes complets, **noms normalisés en minuscules**.
	 *
	 * Un en-tête présent plusieurs fois voit ses valeurs **jointes par `, `**
	 * dans l'ordre d'apparition. Ce choix ne perd rien d'important : le seul
	 * en-tête répétable qui porte de la valeur métier est `References`, exposé
	 * ici en tableau par le champ dédié du même nom. Une union
	 * `string | string[]` obligerait à gérer deux formes à chaque lecture.
	 */
	headers: Record<string, string>
	attachments: InboundAttachment[]

	receivedAt: string
	/** Indices anti-spam de l'ESP, quand il en fournit. */
	spam?: { score?: number; status?: string }
}

export type InboundAttachment = {
	name: string
	contentType: string
	contentLength: number
	/** Contenu base64 quand l'ESP l'inclut dans son webhook (Postmark). */
	content?: string
	/** URL de téléchargement directe, quand l'ESP en fournit une. */
	downloadUrl?: string
	/**
	 * Identifiant ou jeton à passer à l'API de l'ESP pour obtenir le contenu
	 * (`id` chez Resend, `DownloadToken` chez Brevo). Ni l'un ni l'autre ne
	 * donne d'URL directe, et la librairie ne télécharge rien d'elle-même : un
	 * message de 25 Mo n'a pas à transiter par sa mémoire sans qu'on l'ait
	 * demandé.
	 */
	espAttachmentId?: string
}
