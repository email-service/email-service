import { EmailPayload, HeadersPayLoad, IEmailService, NormalizedEmailPayload, Recipient, StandardResponse, WebHookResponse, WebHookResponseData, WebHookStatus } from "../../types/email.type.js";
import { ConfigBrevo } from "../../types/emailServiceSelector.type.js";
import { errorManagement } from "../../utils/error.js";
import { toRecordHeaders } from "../../utils/headers.js";
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