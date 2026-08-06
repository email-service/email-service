import { EmailPayload, HeadersPayLoad, IEmailService, NormalizedEmailPayload, Recipient, StandardResponse, WebHookResponse, WebHookResponseData, WebHookStatus } from "../../types/email.type.js";
import { ConfigBrevo } from "../../types/emailServiceSelector.type.js";
import { errorManagement } from "../../utils/error.js";
import { toRecordHeaders } from "../../utils/headers.js";
import { extractThreading, normalizeInboundHeaders, toRecipient, toRecipients } from "../../utils/inboundNormalize.js";
import type { InboundMessage, InboundResponse } from "../../types/inbound.type.js";
import { ESP, type ESPOptions } from "../esp.js";
import { errorCode } from "./brevo.errors.js";
import { webHookStatus } from "./brevo.status.js";

// `convertToBrevoAddress` a été retiré en v0.6.2 : il n'était appelé nulle part
// (le payload brut partait tel quel) et la conversion vers `{ email, name }` est
// désormais faite en amont par `normalizePayload`.

export class BrevoEmailService extends ESP<ConfigBrevo> implements IEmailService {

	constructor(service: ConfigBrevo, opts?: ESPOptions) {
		super(service, opts)
	}

	protected async doSendMail(options: NormalizedEmailPayload): Promise<StandardResponse> {
		try {

			// L'API Brevo attend des OBJETS `{ email, name? }` pour `sender` et
			// `replyTo`, et des tableaux d'objets pour `to`/`cc`/`bcc`. Le payload
			// normalisé par `ESP.sendMail()` fournit exactement cette forme —
			// jusqu'à la v0.6.2 la valeur brute du payload était transmise, donc
			// une chaîne dès que l'appelant en fournissait une.
			const body: Record<string, unknown> = {

				sender: options.from,
				to: options.to,
				cc: options.cc,
				bcc: options.bcc,
				subject: options.subject,
				htmlContent: options.html,
				textContent: options.text,

				tags: [options.tag],
				replyTo: options.replyTo,
				// En-têtes personnalisés : objet clé/valeur côté Brevo. Ils étaient
				// commentés jusqu'à la v0.6.2 — aucun en-tête n'atteignait Brevo,
				// `List-Unsubscribe` compris.
				headers: toRecordHeaders(options.headers),
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Attachments: options.attachments

			}



			if (options.metaData) {
				// Fusion, jamais écrasement : les en-têtes personnalisés ci-dessus
				// doivent survivre à l'ajout de X-Mailin-custom.
				body.headers = { ...(body.headers as Record<string, string>), 'X-Mailin-custom': JSON.stringify(options.metaData) }
			}

			const opts = {
				method: 'POST', headers: {
					'accept': 'application/json',
					'content-type': 'application/json',
					'api-key': this.transporter.apiKey
				},
				body: JSON.stringify(body)
			};
			if (this.transporter.logger) console.log('******** ES-SendMail Brevo ******** sendMail', body, opts)
			const response = await fetch('https://api.brevo.com/v3/smtp/email', opts)
			if (this.transporter.logger) console.log('******** ES-SendMail Brevo ******** response from fetch', response)
			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES-SendMail Brevo ******** json', retour)
			if (response.ok) {
				return {
					success: true,
					status: 200,
					data: {
						to: options.to,
						cc: options.cc,
						bcc: options.bcc,
						submittedAt: new Date().toISOString(), //Pour acceepter les dates sous forme de string
						messageId: retour.messageId
					}
				}
			}

			else {

				if (this.transporter.logger) console.log('******** ES-SendMail Brevo ******** errorCode', errorCode[retour.code] || retour.message)
				return { success: false, status: response.status, error: errorCode[retour.code] || retour.message }

			}

		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}


	/**
	 * Réception Brevo — corps et en-têtes complets sont dans le webhook, donc
	 * **aucun appel API** dans le flux nominal : seules les pièces jointes
	 * exigent un `DownloadToken`, remonté tel quel sans être consommé.
	 *
	 * Particularité : Brevo est le SEUL ESP à grouper plusieurs messages dans un
	 * même webhook (`items[]`) — c'est la raison d'être du tableau retourné par
	 * `getInboundEmail`.
	 */
	async inboundManagement(req: any): Promise<InboundResponse> {
		const items = Array.isArray(req?.items) ? req.items : (req ? [req] : [])
		if (items.length === 0) {
			return { success: false, status: 400, error: { name: 'NOT_AN_INBOUND_PAYLOAD', message: 'Payload does not look like a Brevo inbound message' } }
		}

		const data: InboundMessage[] = items.map((item: any) => {
			// Les valeurs peuvent être des tableaux quand un en-tête se répète
			// (References, typiquement) — `normalizeInboundHeaders` les joint.
			const headers = normalizeInboundHeaders(item.Headers)
			const threading = extractThreading(headers)

			// Brevo expose aussi InReplyTo hors des en-têtes : on garde la valeur
			// des en-têtes en priorité, elle est la source RFC.
			const inReplyTo = threading.inReplyTo || item.InReplyTo || undefined
			const references = threading.references
				?? (inReplyTo ? [inReplyTo] : undefined)

			return {
				messageId: headers['message-id'] || item.MessageId,
				espMessageId: Array.isArray(item.Uuid) ? item.Uuid[0] : item.Uuid,
				inReplyTo,
				references,
				// Brevo n'expose pas d'équivalent direct de `received_for` :
				// `Delivered-To` en tient lieu quand il est présent.
				receivedFor: headers['delivered-to'] ? [headers['delivered-to']] : undefined,
				from: toRecipient(item.From) as Recipient,
				to: toRecipients(item.To),
				cc: item.Cc?.length ? toRecipients(item.Cc) : undefined,
				replyTo: item.ReplyTo ? toRecipient(item.ReplyTo) : undefined,
				subject: item.Subject ?? '',
				html: item.RawHtmlBody || undefined,
				text: item.RawTextBody || undefined,
				// Équivalent du StrippedTextReply de Postmark : le message isolé
				// de la citation et de la signature.
				strippedTextReply: item.ExtractedMarkdownMessage || undefined,
				headers,
				attachments: (item.Attachments ?? []).map((a: any) => ({
					name: a.Name,
					contentType: a.ContentType,
					contentLength: a.ContentLength,
					espAttachmentId: a.DownloadToken,
				})),
				receivedAt: item.SentAtDate ? new Date(item.SentAtDate).toISOString() : new Date().toISOString(),
				spam: item.Spam ? { score: item.Spam.Score } : undefined,
			}
		})

		return { success: true, status: 200, data, espData: req }
	}

	async webHookManagement(req: any): Promise<WebHookResponse> {
		if (this.transporter.logger) {
			console.log('******** ES-WebHook Brevo ******** transporter', this.transporter)
			console.log('******** ES-WebHook Brevo ******** req.event', req.event)
		}
		let result: WebHookStatus = webHookStatus[req.event]
		if (result) {

			const nameOfMessageIfForBrevo = 'message-id'

			const data: WebHookResponseData = {
				webHookType: result,
				message: req?.reason,
				messageId: req[nameOfMessageIfForBrevo],
				to: req?.email,
				subject: req?.subject ? req.subject : undefined,
				from: req?.From ? req.From : undefined,
			}

			if (req['X-Mailin-custom']) {
				try {
					data.metaData = JSON.parse(req['X-Mailin-custom'])
				}
				catch (error) {
					if (this.transporter.logger) console.log('******** ES-WebHook Brevo ******** error on parse metaData', error)
				}
			}

			if (this.transporter.logger)
				console.log('******** ES-WebHook Brevo ******** result', data)

			return {
				success: true, status: 200, data, espData: {
					...req,
					espRecordType: req?.event,
					espType: req?.event
				}
			}
		}
		else return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }

	}

}


//transporter.close();