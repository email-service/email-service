import { EmailPayload, IEmailService, NormalizedEmailPayload, Recipient, StandardResponse, WebHookResponse, WebHookResponseData, WebHookStatus } from "../../types/email.type.js";
import { ConfigResend } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedError } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP, type ESPOptions } from "../esp.js";
import { resolveBounce, webHookStatus } from "./resend.status.js";
import { errorCode } from "./resend.errors.js";
import { toRecordHeaders } from "../../utils/headers.js";
import { extractThreading, normalizeInboundHeaders, toRecipient, toRecipients } from "../../utils/inboundNormalize.js";
import { parseRawHeaders } from "../../utils/parseHeaders.js";
import type { InboundMessage, InboundResponse } from "../../types/inbound.type.js";
import type { Config } from "../../types/emailServiceSelector.type.js";



/**
 * Resend n'accepte dans ses tags que des lettres ASCII, des chiffres, `_` et
 * `-` : toute autre valeur fait échouer l'envoi entier (400). On remplace donc
 * les caractères refusés plutôt que de laisser passer une requête vouée à
 * l'échec — la valeur transmise peut donc différer de l'originale (un `@` ou un
 * `.` deviennent `-`), ce qui convient à un identifiant mais pas à une adresse
 * qu'on voudrait relire telle quelle.
 */
function sanitizeTagValue(value: string): string {
	return String(value).replace(/[^A-Za-z0-9_-]/g, '-')
}

/**
 * Convertit `metaData` en tags Resend — seul canal par lequel une information
 * de l'appelant revient dans les webhooks (`data.tags`), les en-têtes
 * personnalisés n'y figurant pas.
 *
 * Les valeurs non scalaires sont ignorées : elles ne survivraient pas à
 * l'assainissement, et un JSON aplati serait illisible au retour. Resend
 * plafonne à 75 tags, dont un est déjà pris par `tag`.
 */
function metaDataToTags(metaData: object | undefined): { name: string, value: string }[] {
	if (!metaData) return []
	return Object.entries(metaData)
		.filter(([, value]) => value !== undefined && value !== null && typeof value !== 'object')
		.slice(0, 74)
		.map(([name, value]) => ({ name: sanitizeTagValue(name), value: sanitizeTagValue(String(value)) }))
}

export class ResendEmailService extends ESP<ConfigResend> implements IEmailService {

	constructor(service: ConfigResend, opts?: ESPOptions) {
		super(service, opts)
	}



	protected async doSendMail(options: NormalizedEmailPayload): Promise<StandardResponse> {

		try {
			// Les adresses sont déjà normalisées par `ESP.sendMail()` : `from` et
			// `to/cc/bcc` sont garantis en Recipient/Recipient[], et `replyTo` est
			// résolu. (Cette normalisation vivait ici jusqu'à la v0.6.2 — Resend
			// était le seul adaptateur à la faire, d'où le `From: undefined` des
			// autres sur une chaîne nue.)
			const body = {

				from: formatFromForResend(options.from),
				to: formatForResend(options.to),
				cc: options.cc ? formatForResend(options.cc) : undefined,
				bcc: options.bcc ? formatForResend(options.bcc) : undefined,
				subject: options.subject,
				html: options.html,
				text: options.text,
				tags: [
					{ name: 'tag', value: sanitizeTagValue(options?.tag ? options.tag : 'DefaultTag') },
					...metaDataToTags(options.metaData),
				],
				reply_to: formatFromForResend(options.replyTo),

				headers: toRecordHeaders(options.headers),


			}

			const opts = {
				method: 'POST', headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + this.transporter.apiKey
				},
				body: JSON.stringify(body)
			};
			if (this.transporter.logger) console.log('******** ES ********  ResendEmailService.sendMail', opts)
			const response = await fetch('https://api.resend.com/emails', opts)
			if (this.transporter.logger) console.log('******** ES ********  ResendEmailService.sendMail - response from fetch', response)
			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES ********  ResendEmailService.sendMail - json', retour)
			if (!(response.status === 200)) {
				// Toujours logguer la réponse brute de Resend en cas d'erreur, même sans logger actif :
				// le mapping d'erreur en aval masque sinon le message réel (domain_not_verified,
				// invalid_api_key, testing_mode_restricted_from_domain…).
				console.log('******** ES ********  ResendEmailService.sendMail - ERROR body from Resend:', response.status, response.statusText, JSON.stringify(retour))
			}
			if (response.status === 200) {
				return {
					success: true,
					status: response.status,
					data: {
						to: options.to,
						cc: options.cc,
						bcc: options.bcc,
						submittedAt: new Date().toISOString(), //Pour acceepter les dates sous forme de string
						messageId: retour.id
					}
				}
			}

			// Resend renvoie { statusCode, name, message } — name est un slug snake_case
			// (ex: validation_error, invalid_api_key). On mappe via resend.errors.ts,
			// et en fallback on conserve le name brut pour ne jamais perdre l'info.
			const mapped = errorCode[retour.name]
			const errorResult: ESPStandardizedError = mapped
				? { ...mapped, cause: { code: retour.name, message: retour.message, statusCode: retour.statusCode } }
				: { name: retour.name || 'UNKNOWN', category: 'SERVER_EXCEPTION', cause: { code: retour.name, message: retour.message, statusCode: retour.statusCode } }

			return {
				success: false, status: response.status,
				error: errorResult
			}

		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}

	/**
	 * Réception Resend — le seul adaptateur qui appelle le réseau, et il le fait
	 * **trois fois** par message :
	 *
	 * 1. le webhook ne porte que des métadonnées (ni corps, ni en-têtes) ;
	 * 2. `GET /emails/receiving/{id}` rend le corps, mais des en-têtes limités
	 *    (`from`, `return-path`, `mime-version`) ;
	 * 3. `raw.download_url` est donc **systématiquement** nécessaire pour obtenir
	 *    `In-Reply-To` et `References` — c'est-à-dire le rattachement au fil,
	 *    seule raison d'être de la réception.
	 *
	 * Le brut est lu en **requête partielle** : les en-têtes occupent le début du
	 * message, alors que le fichier complet contient les pièces jointes encodées.
	 * Rapatrier 25 Mo pour lire trois lignes n'aurait aucun sens. Repli sur le
	 * téléchargement complet si le serveur ignore l'en-tête `Range`.
	 */
	async inboundManagement(req: any, config?: Config): Promise<InboundResponse> {
		const event = req?.data
		if (!event || !event.email_id) {
			return { success: false, status: 400, error: { name: 'NOT_AN_INBOUND_PAYLOAD', message: 'Payload does not look like a Resend email.received event' } }
		}

		const apiKey = (config as ConfigResend)?.apiKey ?? this.transporter?.apiKey
		if (!apiKey) {
			// Jamais de message tronqué en silence : sans clé, Resend ne donne ni
			// corps ni en-têtes, donc rien d'exploitable.
			return {
				success: false, status: 400,
				error: { name: 'CONFIG_REQUIRED_FOR_INBOUND', message: 'Resend inbound needs a Config with apiKey: its webhook carries metadata only' }
			}
		}

		try {
			const detail = await this.fetchReceivedEmail(event.email_id, apiKey)
			if (!detail) {
				return { success: false, status: 502, error: { name: 'INBOUND_FETCH_FAILED', message: 'Could not retrieve the received email from Resend' } }
			}

			// En-têtes de l'API (limités) complétés par ceux du message brut.
			let headers = normalizeInboundHeaders(detail.headers)
			if (detail.raw?.download_url) {
				const rawHeaders = await this.fetchRawHeaders(detail.raw.download_url)
				// Le brut fait autorité : c'est la source RFC du message.
				headers = { ...headers, ...rawHeaders }
			}

			const { inReplyTo, references } = extractThreading(headers)

			const message: InboundMessage = {
				messageId: headers['message-id'] || event.message_id,
				espMessageId: event.email_id,
				inReplyTo,
				references,
				// `received_for` est un TABLEAU chez Resend (clause `for` des
				// en-têtes Received) — pas une adresse unique.
				receivedFor: event.received_for?.length ? event.received_for : undefined,
				from: toRecipient(headers['from'] || detail.from || event.from) as Recipient,
				to: toRecipients(detail.to ?? event.to),
				cc: event.cc?.length ? toRecipients(event.cc) : undefined,
				replyTo: headers['reply-to'] ? toRecipient(headers['reply-to']) : undefined,
				subject: detail.subject ?? event.subject ?? '',
				html: detail.html || undefined,
				text: detail.text || undefined,
				headers,
				// Rien n'est téléchargé : on remonte les identifiants à passer à
				// l'API pièces jointes de Resend.
				attachments: (detail.attachments ?? event.attachments ?? []).map((a: any) => ({
					name: a.filename,
					contentType: a.content_type,
					contentLength: a.content_length,
					espAttachmentId: a.id,
				})),
				receivedAt: event.created_at ?? new Date().toISOString(),
			}

			return { success: true, status: 200, data: [message], espData: { event: req, detail } }

		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) }
		}
	}

	/** `GET /emails/receiving/{id}` — corps, en-têtes limités, URL du brut. */
	private async fetchReceivedEmail(emailId: string, apiKey: string): Promise<any | undefined> {
		const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
			method: 'GET',
			headers: { 'Authorization': 'Bearer ' + apiKey },
		})
		if (!response.ok) {
			console.log('******** ES-Inbound Resend ******** retrieve failed', response.status, response.statusText)
			return undefined
		}
		return await response.json()
	}

	/**
	 * Lit les en-têtes du message brut. `Range` limite le transfert au début du
	 * fichier ; un serveur qui l'ignore renvoie 200 et le corps entier, ce qui
	 * reste correct — `parseRawHeaders` s'arrête de toute façon à la première
	 * ligne vide.
	 */
	private async fetchRawHeaders(downloadUrl: string): Promise<Record<string, string>> {
		try {
			const response = await fetch(downloadUrl, {
				method: 'GET',
				headers: { 'Range': 'bytes=0-65535' },
			})
			if (!response.ok && response.status !== 206) {
				console.log('******** ES-Inbound Resend ******** raw fetch failed', response.status, response.statusText)
				return {}
			}
			return parseRawHeaders(await response.text())
		} catch (error) {
			// Le brut est un complément : son échec ne doit pas perdre le message,
			// même si le rattachement au fil en pâtit.
			console.log('******** ES-Inbound Resend ******** raw fetch error', error)
			return {}
		}
	}

	async webHookManagement(req: any): Promise<WebHookResponse> {

		let result: WebHookStatus = webHookStatus[req.type]

		// Un seul événement `email.bounced` couvre les deux natures de rebond :
		// c'est `data.bounce.type` qui tranche, et lui seul. Sans cette lecture,
		// une adresse définitivement morte passait pour un incident passager —
		// elle n'entrait donc jamais en suppression list et restait ciblée par
		// tous les envois suivants (constaté en production le 2026-08-31).
		const bounce = result === 'SOFT_BOUNCE' ? resolveBounce(req.data?.bounce) : null
		if (bounce) result = bounce.kind === 'hard' ? 'HARD_BOUNCE' : 'SOFT_BOUNCE'

		const data: WebHookResponseData = {
			webHookType: result,
			message: 'n/a',
			messageId: req.data.email_id,
			to: req.data.to[0],
			subject: req.data.subject,
			from: req.data.from,
			...(bounce ? { bounce } : {}),
		}

		// Resend renvoie les tags dans ses webhooks (`Record<string,string>`) —
		// c'est le seul canal disponible pour retrouver les métadonnées de l'envoi,
		// les en-têtes personnalisés n'y figurant PAS. Le tag technique `tag` est
		// écarté : il porte `options.tag`, pas une métadonnée.
		if (req.data.tags) {
			const { tag, ...meta } = req.data.tags
			if (Object.keys(meta).length > 0) data.metaData = meta
		}


		if (result)
			return { success: true, status: 200, data, espData: req }
		else return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }

	}

	async checkServer(name: string, apiKey: string) {
		// Rechercher si le serveur existe

		// Le créer s'il n'existe pas


	}

}


/**
 * Converts recipients to Resend format: ["John Doe <john@example.com>", "Jane Doe <jane@example.com>"]
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns An array of strings formatted for Resend.
 */
function formatForResend(recipients: Recipient[]): string[] {
	return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email);
}


/**
 * Converts recipients to PostMark format: "John Doe <john@example.com>, Jane Doe <jane@example.com>"
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns A string formatted for PostMark.
 */
function formatFromForResend(from: Recipient): string {
	return (from.name ? `${from.name} <${from.email}>` : from.email)
}