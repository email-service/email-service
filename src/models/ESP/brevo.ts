import { EmailPayload } from "../../types/email.type";
import { ConfigBrevo, IEmailService, StandardResponse } from "../../types/emailDispatcher.type";
import { StandardError } from "../../types/error.type";
import { errorManagement } from "../../utils/error";
import { ESP } from "../esp";



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
			console.log('opts', opts)
			const response = await fetch(this.transporter.host, opts)
			console.log('response', response)
			const retour = await response.json()

			console.log("retour", retour)
			if (response.ok) {
				return {
					success: true,
					data:  {
						to: options.to,
						submittedAt: new Date().toISOString(), //Pour acceepter les dates sous forme de string
						messageId: retour.messageId
					}
				}
			}

			else {
				const errorCode: { [key: string]: StandardError } = {
					unauthorized: { status: 401, name : 'UNAUTHORIZED', message: 'Unauthorized APIKey not valid' },
					invalid_parameter: { status: 422, name : 'EMAIL_INVALID', message: 'email not valid' }
				};
				return { success: false, error: errorCode[retour.code] || retour.message }
			}




		} catch (error) {
			return { success: false, error: errorManagement(error) };
		}
	}

	
	async webHookManagement(req: any): Promise<StandardResponse> {
		return { success: false, error: { status: 500, name: 'TO_DEVELOP', message: 'WIP : Work in progress for brevo' } }
		
	}

}


//transporter.close();