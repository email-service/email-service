import { EmailPayload, IEmailService, StandardResponse, WebHookResponse, WebHookResponseData, WebHookStatus } from "../../types/email.type.js";
import { ConfigResend } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedError } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP } from "../esp.js";
import { webHookStatus } from "./resend.status.js";
import { errorCode } from "./postMark.errors.js";
import { transformHeaders } from "../../utils/transformeHeaders.js";



export class ResendEmailService extends ESP<ConfigResend> implements IEmailService {

	constructor(service: ConfigResend) {
		super(service)
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		try {
			const body = {

				from: 'romain@resend.demoustier.com', //options.from,
				to: [options.to],
				subject: options.subject,
				html: options.html,
				text: options.text,
				tags: [{ name: 'tag', value: options?.tag ? options.tag : 'DefaultTag' }],
				reply_to: options.from,

				headers: options.headers ? transformHeaders(options.headers) : {},


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
			if (response.status === 200) {
				return {
					success: true,
					status: response.status,
					data: {
						to: options.to,
						submittedAt: new Date().toISOString(), //Pour acceepter les dates sous forme de string
						messageId: retour.id
					}
				}
			}

			console.log('******** ES ********  ResendEmailService.sendMail - retour.ErrorCode', retour.name)

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

	async webHookManagement(req: any): Promise<WebHookResponse> {

		const result: WebHookStatus = webHookStatus[req.type]


		const data: WebHookResponseData = {
			webHookType: result,
			message: 'n/a',
			messageId: req.data.email_id,
			to: req.data.to[0],
			subject: req.data.subject,
			from: req.data.from,
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



//transporter.close();