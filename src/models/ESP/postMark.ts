<<<<<<< Updated upstream:src/models/PostMarkEmailService.ts
import { EmailPayload } from "../types/email.type";
import { ConfigPostmark, IEmailService, SendMailResponse } from "../types/emailDispatcher.type";
=======
import { EmailPayload } from "../../types/email.type";
import { ConfigPostmark, IEmailService, StandardResponse } from "../../types/emailDispatcher.type";
import { ESP } from "../esp";
>>>>>>> Stashed changes:src/models/ESP/postMark.ts



export class PostMarkEmailService extends ESP implements IEmailService {
	
	constructor(service: ConfigPostmark) {
		super(service)
	}

<<<<<<< Updated upstream:src/models/PostMarkEmailService.ts
	async sendMail(options: EmailPayload): Promise<SendMailResponse> {
=======
	async sendMail(options: EmailPayload): Promise<StandardResponse> {
>>>>>>> Stashed changes:src/models/ESP/postMark.ts
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
<<<<<<< Updated upstream:src/models/PostMarkEmailService.ts
				ReplyTo: 'server@simu.immo',
				// Headers: options.headers,
=======
				 ReplyTo: 'server@question.direct',
				 //Headers: options.headers,
				 Metadata : options.meta,
>>>>>>> Stashed changes:src/models/ESP/postMark.ts
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Metadata: options.metadata,
				// Attachments: options.attachments


				Headers :[ {name :'X-QD-Meta' , value : JSON.stringify(options.meta)
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
					ok: true,
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
				return { ok: false, error: retour.Message }
			}


		} catch (error) {
			console.log('Error occurred', error);
			return { ok: false, error };
		}
	}


	async webHook(req: any): Promise<StandardResponse> {
		throw new Error("Method not implemented.");
	}

}



//transporter.close();