import { EmailPayload } from "../../types/email.type";
import { ConfigMinimal, ConfigPostmark, IEmailService, StandardResponse } from "../../types/emailDispatcher.type";
import { StandardError } from "../../types/error.type";
import { errorManagement } from "../../utils/error";
import { ESP } from "../esp";



export class PostMarkEmailService extends ESP<ConfigPostmark> implements IEmailService {

	constructor(service: ConfigPostmark) {
		super(service)
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
			const response = await fetch(this.transporter.host, opts)
			const retour = await response.json()

			console.log("retour", retour)
			if (retour.ErrorCode === 0) {
				return {
					success: true,
					data: {
						to: retour.To,
						submittedAt: retour.SubmittedAt, //Pour acceepter les dates sous forme de string
						messageId: retour.MessageID
					}
				}
			}
			const errorCode: { [key: number]: StandardError } = {
				10: { status: 401, name : 'UNAUTHORIZED', message: 'Unauthorized APIKey not valid' },
				300: { status: 422, name : 'EMAIL_INVALID', message: 'email not valid' }
			};

			return { success: false, error: errorCode[retour.ErrorCode] || retour.Message };


		} catch (error) {
			return { success: false, error: errorManagement(error) };
		}
	}


	async webHookManagement(req: any): Promise<StandardResponse> {
		return { success: false, error: { status: 500, name: 'TO_DEVELOP', message: 'WIP : Work in progress for postMark' } }

	}

}



//transporter.close();