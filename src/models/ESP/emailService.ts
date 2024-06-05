import { EmailPayload } from "../../types/email.type.js";
import { ConfigEmailServiceViewer, ConfigPostmark, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP } from "../esp.js";

export class ViewerEmailService extends ESP<ConfigEmailServiceViewer> implements IEmailService {

	constructor(service: ConfigEmailServiceViewer) {
		super(service)
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		try {
			const body = {
				from: options.from,
				to: options.to,
				subject: options.subject,
				htmlBody: options.html,
				textBody: options.text,
				tag: 'email-test',
				// Tag: options.tag,
				replyTo: 'server@question.direct',
				//Headers: options.headers,
				metadata: options.meta,
				// TrackOpens: options.trackOpens,
				// TrackLinks: options.trackLinks,
				// Metadata: options.metadata,
				// Attachments: options.attachments
			}

			const opts = {
				method: 'POST', headers: {
					'Content-Type': 'application/json',
					'X-Mail-Service-Viewer-Token': this.transporter.apiToken,
					'X-Mail-Service-Web-Hook': this.transporter.webhook
				},
				body: JSON.stringify(body)
			};
			const response = await fetch(this.transporter.host, opts)
			if (!response.ok) return  { success: false, status: response.status, error: {name : response.statusText, category : 'server', cause : {uri : this.transporter.host, options : opts}} }
			const retour = await response.json()

			if (retour.success)
				return {
					success: true,
					status: 200,
					data: retour.data
				}
			else {
				return { success: false, status: retour.status, error: retour.error }
			}


		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}



	async webHookManagement(req: any): Promise<StandardResponse> {
		return { success: false, status: 500,error: {  name: 'TO_DEVELOP', message: 'WIP : Work in progress for email-service-viewer' } }

	}

}



//transporter.close();