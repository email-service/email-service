import { EmailPayload } from "../../types/email.type.js";
import { ConfigMinimal, ConfigPostmark, ConfigResend, IEmailService, StandardResponse, WebHookResponse } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedError, ESPStandardizedWebHook, StandardError } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP } from "../esp.js";
import { webHookStatus } from "./postMark.status.js";
import { errorCode } from "./postMark.errors.js";



export class ResendEmailService extends ESP<ConfigResend> implements IEmailService {

	constructor(service: ConfigResend) {
		super(service)
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		try {
			const body = {
				
				from: options.from,
				to: [options.to],
				subject: options.subject,
				html: options.html,
				text: options.text,
				tags: [{name: 'tagtest', value:'email-test'}],
				// Tag: options.tag,
				reply_to: 'server@question.direct',
				//Headers: options.headers,
				//Metadata: options.meta,
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Metadata: options.metadata,
				// Attachments: options.attachments


				headers: {
					name: 'X-QD-Meta', value: JSON.stringify(options.meta)
				}
			}

			const opts = {
				method: 'POST', headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + this.transporter.apiKey
				},
				body: JSON.stringify(body)
			};
			if (this.transporter.logger) console.log('******** ES ********  ResendEmailService.sendMail', opts)
			const response = await fetch(this.transporter.host, opts)
			if (this.transporter.logger) console.log('******** ES ********  ResendEmailService.sendMail - response from fetch', response)
			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES ********  ResendEmailService.sendMail - json', retour)
			if (retour.ErrorCode === 0) {
				return {
					success: true,
					status: response.status,
					data: {
						to: retour.To,
						submittedAt: retour.SubmittedAt, //Pour acceepter les dates sous forme de string
						messageId: retour.MessageID
					}
				}
			}

			const errorResult: ESPStandardizedError = errorCode[retour.ErrorCode] || { name: 'UNKNOWN', category: 'Account' }
			errorResult.cause = { code: retour.ErrorCode, message: retour.Message }

			return {
				success: false, status: response.status,
				error: errorResult
			}

		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}

	webHookManagement(req: any): WebHookResponse {

		const result: ESPStandardizedWebHook = webHookStatus[req.RecordType]

		if (result)
			return { success: true, status: 200, data: result, espData: req }
		else return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }

	}

	async checkServer(name: string, apiKey: string) {
		// Rechercher si le serveur existe

		// Le créer s'il n'existe pas


	}

}



//transporter.close();