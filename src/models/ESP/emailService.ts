import { EmailPayload, IEmailService, NormalizedEmailPayload, Recipient, StandardResponse, WebHookResponse, WebHookResponseData, WebHookStatus } from "../../types/email.type.js";
import { ConfigEmailServiceViewer } from "../../types/emailServiceSelector.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP, type ESPOptions } from "../esp.js";
import { webHookStatus } from "./emailService.status.js";
import { extractThreading, normalizeInboundHeaders, toRecipient, toRecipients } from "../../utils/inboundNormalize.js";
import type { InboundMessage, InboundResponse } from "../../types/inbound.type.js";

export class ViewerEmailService extends ESP<ConfigEmailServiceViewer> implements IEmailService {

	constructor(service: ConfigEmailServiceViewer, opts?: ESPOptions) {
		super(service, opts)
	}

	protected async doSendMail(options: NormalizedEmailPayload): Promise<StandardResponse> {
		try {
			const body = {
				from: formatFromForEmailService(options.from),
				to: formatForEmailService(options.to),
				cc: options.cc ? formatForEmailService(options.cc) :undefined,
				bcc: options.bcc ? formatForEmailService(options.bcc) : undefined,
				subject: options.subject,
				htmlBody: options.html,
				textBody: options.text,
				tag: options.tag,
				// Le viewer reflète ce qu'on lui donne : la valeur en dur
				// 'server@question.direct' qui vivait ici jusqu'à la v0.6.2 mentait
				// au développeur sur l'adresse de réponse réellement demandée.
				replyTo: formatFromForEmailService(options.replyTo),
				// Service interne : on transmet le tableau `{ name, value }` tel
				// quel, c'est la forme la plus lisible pour l'affichage. Sans lui,
				// aucun en-tête n'était vérifiable sans envoi réel.
				headers: options.headers,
				metaData: options.metaData,
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Attachments: options.attachments
			}

			const opts = {
				method: 'POST', headers: {
					'Content-Type': 'application/json',
					'X-Mail-Service-Viewer-Token': this.transporter.apiToken,
					'X-Mail-Service-Web-Hook': this.transporter.webhook
				},
				body: JSON.stringify(body)
			};
			if (this.transporter.logger) console.log('******** ES-SendMail Email-service-viewer ******** opts', opts)

			// `baseUrl` permet de déplacer le viewer local sur un port dédié. Sans lui,
			// `emailserviceviewerlocal` imposait le port 3000 — celui qu'occupe déjà
			// l'API de bien des projets, rendant les deux inconciliables sur une même
			// machine. Défauts inchangés, donc rétro-compatible.
			const defaultBaseUrl = this.transporter.esp === 'emailserviceviewerlocal'
				? 'http://localhost:3000'
				: 'https://api.email-service.dev'
			const uri = `${(this.transporter.baseUrl ?? defaultBaseUrl).replace(/\/+$/, '')}/sendEmail`

			const response = await fetch(uri, opts)
			if (!response.ok) {
				if (this.transporter.logger) console.log('******** ES-SendMail Email-service-viewer ******** response ko', response.status, response.statusText)
				return { success: false, status: response.status, error: { name: response.statusText, category: 'SERVER_EXCEPTION', cause: opts } }
			}
			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES-SendMail Email-service-viewer ******** data from fetch', retour)

			if (retour.success)
				return {
					success: true,
					status: 200,
					data: retour.data
				}
			else {
				return { success: false, status: retour.status, error: retour.error }
			}

		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}



	/**
	 * Réception simulée par le viewer local. Le viewer poste déjà un objet au
	 * format `InboundMessage` : la normalisation se réduit à combler les champs
	 * absents et à garantir les invariants (`messageId` toujours renseigné,
	 * `headers` en minuscules).
	 *
	 * Objectif : que le consommateur exécute **exactement le même code** en
	 * développement qu'en production.
	 */
	async inboundManagement(req: any): Promise<InboundResponse> {
		if (!req || (!req.messageId && !req.from)) {
			return { success: false, status: 400, error: { name: 'NOT_AN_INBOUND_PAYLOAD', message: 'Payload does not look like a viewer inbound message' } }
		}

		const headers = normalizeInboundHeaders(req.headers)
		const threading = extractThreading(headers)

		const message: InboundMessage = {
			messageId: req.messageId || headers['message-id'] || '',
			espMessageId: req.espMessageId,
			inReplyTo: req.inReplyTo || threading.inReplyTo,
			references: req.references ?? threading.references,
			receivedFor: req.receivedFor
				? (Array.isArray(req.receivedFor) ? req.receivedFor : [req.receivedFor])
				: undefined,
			from: toRecipient(req.from) as Recipient,
			to: toRecipients(req.to),
			cc: req.cc ? toRecipients(req.cc) : undefined,
			replyTo: req.replyTo ? toRecipient(req.replyTo) : undefined,
			subject: req.subject ?? '',
			html: req.html || undefined,
			text: req.text || undefined,
			strippedTextReply: req.strippedTextReply || undefined,
			headers,
			attachments: req.attachments ?? [],
			receivedAt: req.receivedAt ?? new Date().toISOString(),
			spam: req.spam,
		}

		return { success: true, status: 200, data: [message], espData: req }
	}

	async webHookManagement(req: any): Promise<WebHookResponse> {

		if (this.transporter.logger) console.log('******** ES-WebHook Email-service-viewer ******** req', req)

		const result: WebHookStatus = webHookStatus[req.data.type]


		if (result) {

			if (this.transporter.logger) console.log('******** ES-WebHook Email-service-viewer ******** result', result)
			const data: WebHookResponseData = {
				webHookType: result,
				message: 'n/a',
				messageId: req.data.messageId,
				subject: req.data.subject,
				from: req.data.from,
				to: req.data.to,
				metaData: req.data.metaData
			}
			return { success: true, status: 200, data, espData: req.data }
		}
		else return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }

	}

}




/**
 * Converts recipients to Emailservice format: "John Doe <john@example.com>, Jane Doe <jane@example.com>"
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns A string formatted for EmailService.
 */
function formatForEmailService(recipients: Recipient[]): string {
	return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(", ");
}

/**
 * Converts recipients to Emailservice format: "John Doe <john@example.com>, Jane Doe <jane@example.com>"
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns A string formatted for EmailService.
 */
function formatFromForEmailService(recipients: Recipient): string {
	return recipients.name ? `${recipients.name} <${recipients.email}>` : recipients.email
}