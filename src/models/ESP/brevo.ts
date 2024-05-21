import { EmailPayload } from "../../types/email.type";
import { ConfigBrevo, IEmailService, StandardResponse } from "../../types/emailDispatcher.type";
import { ESP } from "../esp";



export class BrevoEmailService extends ESP implements IEmailService {
	
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
				replyTo: { email: 'server@maluro.com' },
				// Headers: options.headers,
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Metadata: options.metadata,
				// Attachments: options.attachments

				headers : {
				'X-Mailin-custom' : JSON.stringify(options.meta)
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
			 if (response.ok ) {
			 	return {
			 		success: true,
			 		retour}
			 	}
			
			 else {
			 	console.log('Error occurred in Brevo');
			 	return { success: false, error: retour }
			 }

		


		} catch (error) {
			console.log('Error occurred', error);
			return { success: false, error };
		}
	}

	async webHook(req: any): Promise<StandardResponse> {

		return { success: true }
	}

}



//transporter.close();