import { EmailPayload } from "../../types/email.type.js";
import { ConfigEmailServiceViewer, ConfigPostmark, IEmailService, StandardResponse, WebHookResponse } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedWebHook } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP } from "../esp.js";
import { webHookStatus } from "./emailService.status.js";

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
				metadata: options.metaData,
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
			if (this.transporter.logger) console.log('******** ES ********  ViewerEmailService.sendMail', opts)
			const response = await fetch(this.transporter.host, opts)
			if (!response.ok) {
				if (this.transporter.logger) console.log('******** ES ********  ViewerEmailService.sendMail - response ko', response.status, response.statusText)
				return { success: false, status: response.status, error: { name: response.statusText, category: 'SERVER_EXCEPTION', cause: { uri: this.transporter.host, options: opts } } }
			}
			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES ********  ViewerEmailService.sendMail - data from fetch', retour)

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



	webHookManagement(req: any): WebHookResponse {
	
		const result : ESPStandardizedWebHook =  webHookStatus[req.data.type]

		if (result) 
			return { success: true, status: 200, data: result , espData: req.data}
		else return  { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }
		
	}

}



//transporter.close();