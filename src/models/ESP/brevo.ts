import { EmailPayload } from "../../types/email.type.js";
import { ConfigBrevo, IEmailService, StandardResponse, WebHookResponse } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedWebHook } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP } from "../esp.js";
import { errorCode } from "./brevo.errors.js";
import { webHookStatus } from "./brevo.status.js";

//const extractAddressFrom = (destination: string) => destination.match(/<.+@.+>/)?.[0].replace(/[<>]/g, "") || destination

const convertToBrevoAddress = ( address:string ) => {
	const a = address.trim()
	if(/.+<.+>$/.test(a)) {
	  const tempo = a.match(/(.+)<(.+@.+)>/) || ['','']
	  return {
		name : tempo[1],
		email : tempo[2]
	  }
	}
	else return {email : a.replace(/[<>]/g,"")}
  }

export class BrevoEmailService extends ESP<ConfigBrevo> implements IEmailService {

	constructor(service: ConfigBrevo) {
		super(service)
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		try {

			// Brevo API does not support the "from" field, so we need to extract the email address from the string
			// const toEmail = extractAddressFrom(options.to)
			// const fromEmail = extractAddressFrom(options.from)

			const body = {

				sender: convertToBrevoAddress(options.from),
				to: [convertToBrevoAddress(options.to)],
				subject: options.subject,
				htmlContent: options.html,
				textContent: options.text,

				tags: [options.tag],
				replyTo: convertToBrevoAddress(options.from),
				// Headers: options.headers,
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Metadata: options.metadata,
				// Attachments: options.attachments

				// headers: {
				// 	'X-Mailin-custom': JSON.stringify(options.meta)
				// }


			}


			if (options.metaData) {
				// @ts-ignore
				body.headers = { 'X-Mailin-custom': JSON.stringify(options.metaData) }
			}

			const opts = {
				method: 'POST', headers: {
					'Content-Type': 'application/json',
					'api-key': this.transporter.apiKey
				},
				body: JSON.stringify(body)
			};
			if (this.transporter.logger) console.log('******** ES ********  BrevoEmailService.sendMail', body)
			const response = await fetch(this.transporter.host, opts)
			if (this.transporter.logger) console.log('******** ES ********  BrevoEmailService.sendMail - response from fetch', response)
			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES ********  BrevoEmailService.sendMail - json', retour)
			if (response.ok) {
				return {
					success: true,
					status: 200,
					data: {
						to: options.to,
						submittedAt: new Date().toISOString(), //Pour acceepter les dates sous forme de string
						messageId: retour.messageId
					}
				}
			}

			else {

				if (this.transporter.logger) console.log('******** ES ********  BrevoEmailService.sendMail - errorCode', errorCode[retour.code] || retour.message)
				return { success: false, status: response.status, error: errorCode[retour.code] || retour.message }

			}

		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}


	webHookManagement(req: any): WebHookResponse {
		if (this.transporter.logger) {
			console.log('******** ES ********  BrevoEmailService.webHookManagement - transporter', this.transporter)
			console.log('******** ES ********  BrevoEmailService.webHookManagement - req.event', req.event)
		}
		let result: ESPStandardizedWebHook = webHookStatus[req.event]

		// MetaData is available in the request body

		if (req['X-Mailin-custom']) {
			try {
				result.metaData = JSON.parse(req['X-Mailin-custom'])
			}
			catch (error) {
				if (this.transporter.logger) console.log('******** ES ********  BrevoEmailService.webHookManagement - error on parse metaData', error)
			}
		}

		if (this.transporter.logger)
			console.log('******** ES ********  BrevoEmailService.webHookManagement - result', result)
		if (result) {
			return { success: true, status: 200, data: result, espData: req }
		}
		else return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }

	}

}


//transporter.close();