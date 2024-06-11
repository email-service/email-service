import { EmailPayload } from "../../types/email.type.js";
import { ConfigMinimal, ConfigPostmark, IEmailService, StandardResponse, WebHookResponse } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedError, ESPStandardizedWebHook, StandardError } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP } from "../esp.js";
import { webHookStatus } from "./postMark.status.js";
import { errorCode } from "./postMark.errors.js";



export class PostMarkEmailService extends ESP<ConfigPostmark> implements IEmailService {

	constructor(service: ConfigPostmark) {
		super(service)
		
			if (this.transporter.stream === undefined) {
				if(this.transporter.logger) console.log('******** ES ********  Stream for ', this.transporter.esp, ' is not defined in the configuration')
				throw new Error('Stream is not defined in the configuration')
			}
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		try {
			const body = {
				MessageStream: this.transporter.stream,
				From: options.from,
				To: options.to,
				Subject: options.subject,
				HtmlBody: options.html,
				TextBody: options.text,
				Tag: 'email-test',
				// Tag: options.tag,
				ReplyTo: 'server@question.direct',
				//Headers: options.headers,
				Metadata: options.meta,
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Metadata: options.metadata,
				// Attachments: options.attachments


				Headers: [{
					name: 'X-QD-Meta', value: JSON.stringify(options.meta)
				}]
			}

			const opts = {
				method: 'POST', headers: {
					'Content-Type': 'application/json',
					'X-Postmark-Server-Token': this.transporter.apiKey
				},
				body: JSON.stringify(body)
			};
			if (this.transporter.logger) console.log('******** ES ********  PostMarkEmailService.sendMail', opts)
			const response = await fetch(this.transporter.host, opts)
			if (this.transporter.logger) console.log('******** ES ********  PostMarkEmailService.sendMail - response from fetch', response)
			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES ********  PostMarkEmailService.sendMail - json', retour)
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

			// Traitement du cas particlier de l'erreur 406

			if (retour.ErrorCode === 406) {
				const suppressionInfos = await this.getSuppressionInfos(options.to)
				console.log('suppressionInfos', suppressionInfos)
			}

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



	getSuppressionInfos = async (address: string) => {
		const extractAddressFrom = (destination: string) => destination.match(/<.+@.+>/)?.[0].replace(/[<>]/g, "") || destination
		try {
			const response = await fetch(
				'https://api.postmarkapp.com/message-streams/outbound/suppressions/dump',
				{
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json",
						"X-Postmark-Server-Token": this.transporter.apiKey
					}
				}
			);
			const result = await response.json();
			console.log('result of getSuppressionInfos', result)
			return result.Suppressions.find((r) => r.EmailAddress === extractAddressFrom(address))
		}
		catch (error) {
			console.log(error)
		}
	}

}



//transporter.close();