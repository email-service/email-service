import { EmailPayload } from "../types/email.type";
import { ConfigPostmark, IEmailService, sendMailResponse } from "../types/emailDispatcher.type";



export class PostMarkEmailService implements IEmailService {
	private transporter: ConfigPostmark
	constructor(service: ConfigPostmark) {
		this.transporter = service

		console.log('Instance of PostMarkEmailService', this)
	}

	async sendMail(options: EmailPayload): Promise<sendMailResponse> {
		try {
			const body = {
				MessageStream: this.transporter.stream,
				From: options.from,
				To: options.to,
				Subject: options.subject,
				HtmlBody: options.html,
				TextBody: options.text,
				Tag: 'email-service',
				// Tag: options.tag,
				 ReplyTo: 'server@simu.immo',
				// Headers: options.headers,
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Metadata: options.metadata,
				// Attachments: options.attachments
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
					retour: {
						to: retour.To,
						submittedAt: retour.SubmittedAt, //Pour acceepter les dates sous forme de string
						messageId: retour.MessageID,
						errorCode: retour.ErrorCode,
						message: retour.Message,
					}
				}
			}
			else {
				console.log('Error occurred');
				return { success: false, error: retour.Message }
			}


		} catch (error) {
			console.log('Error occurred', error);
			return { success: false, error };
		}
	}

}



//transporter.close();