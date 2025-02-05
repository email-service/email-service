import { EmailPayload, IEmailService, Recipient, StandardResponse, WebHookResponse, WebHookResponseData, WebHookStatus } from "../../types/email.type.js";
import { ConfigEmailServiceViewer } from "../../types/emailServiceSelector.type.js";
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
				from: formatFromForEmailService(options.from as Recipient),
				to: formatForEmailService(options.to as Recipient[]),
				cc: options.cc ? formatForEmailService(options.cc as Recipient[]) :undefined,
				bcc: options.bcc ? formatForEmailService(options.bcc as Recipient[] ): undefined,
				subject: options.subject,
				htmlBody: options.html,
				textBody: options.text,
				tag: 'email-test',
				// Tag: options.tag,
				replyTo: 'server@question.direct',
				//Headers: options.headers,
				metaData: options.metaData,
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
			if (this.transporter.logger) console.log('******** ES-SendMail Email-service-viewer ******** opts', opts)

			const uri = this.transporter.esp === 'emailserviceviewerlocal' ? 'http://localhost:3000/sendEmail' : 'https://api.email-service.dev/sendEmail'

			const response = await fetch(uri, opts)
			if (!response.ok) {
				if (this.transporter.logger) console.log('******** ES-SendMail Email-service-viewer ******** response ko', response.status, response.statusText)
				return { success: false, status: response.status, error: { name: response.statusText, category: 'SERVER_EXCEPTION', cause: opts } }
			}
			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES-SendMail Email-service-viewer ******** data from fetch', retour)

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



	async webHookManagement(req: any): Promise<WebHookResponse> {

		if (this.transporter.logger) console.log('******** ES-WebHook Email-service-viewer ******** req', req)

		const result: WebHookStatus = webHookStatus[req.data.type]


		if (result) {

			if (this.transporter.logger) console.log('******** ES-WebHook Email-service-viewer ******** result', result)
			const data: WebHookResponseData = {
				webHookType: result,
				message: 'n/a',
				messageId: req.data.messageId,
				subject: req.data.subject,
				from: req.data.from,
				to: req.data.to,
				metaData: req.data.metaData
			}
			return { success: true, status: 200, data, espData: req.data }
		}
		else return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }

	}

}




/**
 * Converts recipients to Emailservice format: "John Doe <john@example.com>, Jane Doe <jane@example.com>"
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns A string formatted for EmailService.
 */
function formatForEmailService(recipients: Recipient[]): string {
	return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(", ");
}

/**
 * Converts recipients to Emailservice format: "John Doe <john@example.com>, Jane Doe <jane@example.com>"
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns A string formatted for EmailService.
 */
function formatFromForEmailService(recipients: Recipient): string {
	return recipients.name ? `${recipients.name} <${recipients.email}>` : recipients.email
}