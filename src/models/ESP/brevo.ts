import { EmailPayload } from "../../types/email.type";
import { ConfigBrevo, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type";
import { StandardError } from "../../types/error.type";
import { errorManagement } from "../../utils/error";
import { ESP } from "../esp";
import { errorCode } from "./brevo.errors";


export class BrevoEmailService extends ESP<ConfigBrevo> implements IEmailService {

	constructor(service: ConfigBrevo) {
		super(service)
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		try {
			const body = {

				sender: { email: options.from },
				to: [{ email: options.to }],
				subject: options.subject,
				htmlContent: options.html,
				textContent: options.text,

				tags: ['tag-test'],
				replyTo: { email: options.from },
				// Headers: options.headers,
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Metadata: options.metadata,
				// Attachments: options.attachments

				headers: {
					'X-Mailin-custom': JSON.stringify(options.meta)
				}

			}

			const opts = {
				method: 'POST', headers: {
					'Content-Type': 'application/json',
					'api-key': this.transporter.apiKey
				},
				body: JSON.stringify(body)
			};
			console.log('******** ES ********  opts', opts)
			const response = await fetch(this.transporter.host, opts)
			console.log('******** ES ********  response', response)
			const retour = await response.json()

			console.log("retour", retour)
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
				
				return { success: false, status: response.status, error: errorCode[retour.code] || retour.message }
			}




		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}


	async webHookManagement(req: any): Promise<StandardResponse> {
		return { success: false, status: 500, error: { name: 'TO_DEVELOP', message: 'WIP : Work in progress for brevo' } }

	}

}


//transporter.close();