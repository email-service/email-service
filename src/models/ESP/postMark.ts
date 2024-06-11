import { EmailPayload } from "../../types/email.type.js";
import { ConfigPostmark, IEmailService, StandardResponse, WebHookResponse } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedError, ESPStandardizedWebHook, StandardError } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP } from "../esp.js";
import { webHookStatus, bouncesTypes } from "./postMark.status.js";
import { errorCode, supressionListStatus } from "./postMark.errors.js";
export class PostMarkEmailService extends ESP<ConfigPostmark> implements IEmailService {

	constructor(service: ConfigPostmark) {
		super(service)
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {

		if (this.transporter.stream === undefined) {
			if (this.transporter.logger) console.log('******** ES ********  Stream for ', this.transporter.esp, ' is not defined in the configuration')
			throw new Error('Stream is not defined in the configuration')
		}

		try {
			const body = {
				MessageStream: this.transporter.stream,
				From: options.from,
				To: options.to,
				Subject: options.subject,
				HtmlBody: options.html,
				TextBody: options.text,
				Tag: options.tag,
				ReplyTo: options.from,
				//Headers: options.headers,
				Metadata: options.metaData,
				TrackOpens: options.trackOpens,
				TrackLinks: options.trackLinks,
				// Metadata: options.metadata,
				// Attachments: options.attachments


				// Headers: [{
				// 	name: 'X-QD-Meta', value: JSON.stringify(options.metaData)
				// }]
			}

			const opts = {
				method: 'POST', headers: {
					'Content-Type': 'application/json',
					'X-Postmark-Server-Token': this.transporter.apiKey
				},
				body: JSON.stringify(body)
			};
			if (this.transporter.logger) console.log('******** ES ********  PostMarkEmailService.sendMail - to ', body.To)

			const response = await fetch(this.transporter.host, opts)
			if (this.transporter.logger) console.log('******** ES ********  PostMarkEmailService.sendMail - response from fetch', response.status, response.statusText)

			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES ********  PostMarkEmailService.sendMail - json', retour.ErrorCode, retour.Message)

			const returneValue = await this.sendMailResultManagement(retour, response, options)

			if (this.transporter.logger) console.log('******** ES ********  PostMarkEmailService.sendMail - returneValue', returneValue)
			return returneValue

		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}


	async sendMailResultManagement(retour: any, response: any, options: EmailPayload): Promise<StandardResponse> {

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
			const errorResult406: ESPStandardizedError = supressionListStatus[suppressionInfos.SuppressionReason] || { name: 'UNKNOWN', category: 'Account' }
			return {
				success: false,
				status: response.status,
				error: errorResult406
			}
		}

		return {
			success: false, status: response.status,
			error: errorResult
		}

	}

	getSuppressionInfos = async (address: string) => {
		const extractAddressFrom = (destination: string) => destination.match(/<.+@.+>/)?.[0].replace(/[<>]/g, "") || destination
		try {
			const response = await fetch(
				`https://api.postmarkapp.com/message-streams/${this.transporter.stream}/suppressions/dump`,
				{
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json",
						"X-Postmark-Server-Token": this.transporter.apiKey
					}
				}
			);
			const result = await response.json();

			type PostMarkSuppression = {
				EmailAddress: string,
				SupressionReason: string,
				Origin: string,
				CreatedAt: Date
			}

			return result.Suppressions.find((r: PostMarkSuppression) => r.EmailAddress === extractAddressFrom(address))
		}
		catch (error) {
			console.log(error)
		}
	}


	webHookManagement(req: any): WebHookResponse {
		if (this.transporter.logger) {
			console.log('******** ES ********  PostMarkEmailService.webHookManagement - transporter', this.transporter)
			console.log('******** ES ********  PostMarkEmailService.webHookManagement - req.RecordType', req.RecordType)
		}
		let result: ESPStandardizedWebHook = webHookStatus[req.RecordType]

		if (req.RecordType === 'Bounce' && req.TypeCode) {
			// @ts-ignore
			const errorValue = bouncesTypes[req.TypeCode]
			console.log('******** ES ********  PostMarkEmailService.webHookManagement - errorValue', errorValue)
			if (errorValue)
				result = { webHookType: errorValue.webHookEventType, message: errorValue.name }

		}

		// Manage the metaData
		console.log('******** ES ********  PostMarkEmailService.webHookManagement - req', req)
		if (req.Metadata)
			result.metaData = req.Metadata

		if (this.transporter.logger)
			console.log('******** ES ********  PostMarkEmailService.webHookManagement - result', result)
		if (result) {
			return { success: true, status: 200, data: result, espData: req }
		}
		else return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }

	}

}


//transporter.close();