import type { EmailPayload, IEmailService, Recipient, StandardResponse, WebHookResponse } from "../types/email.type.js";
import type { Config, ConfigMinimal } from "../types/emailServiceSelector.type.js";
import { checkValidityOfEmails, isValidEmail } from "../utils/normalizeEmailRecipients.js";
import { BrevoEmailService } from "./ESP/brevo.js";
import { ViewerEmailService } from "./ESP/emailService.js";
//import { NodeMailerEmailService } from "./ESP/nodeMailer.js";
import { PostMarkEmailService } from "./ESP/postMark.js";
import { ResendEmailService } from "./ESP/resend.js";
import { ScaleWayEmailService } from "./ESP/scaleway.js";

export class EmailServiceSelector {
	private emailService: IEmailService | undefined;

	constructor(service: Config) {
		switch (service.esp) {
			case 'postmark':
				this.emailService = new PostMarkEmailService(service);
				break;

			case 'nodemailer':
				//this.emailService = new NodeMailerEmailService(service);
				break;

			case 'brevo':
				this.emailService = new BrevoEmailService(service);
				break;

			case 'emailserviceviewer':
				this.emailService = new ViewerEmailService(service);
				break;
			case 'emailserviceviewerlocal':
				this.emailService = new ViewerEmailService(service);
				break
			case 'resend':
				this.emailService = new ResendEmailService(service);
				break;

			case 'scaleway':
				this.emailService = new ScaleWayEmailService(service);
				break;

			default:
				throw new Error('Invalid ESP');
				break;
		}
	}

	async sendEmail(email: EmailPayload | EmailPayload[]): Promise<StandardResponse | StandardResponse[]> {

		if (!email) return ({ success: false, status: 400, error: { name: 'NO_EMAIL', message: 'No email provided' } })


		const typeOfPayload: 'object' | 'array' | 'unknown' = Array.isArray(email) ? 'array' : (typeof email === 'object') ? 'object' : 'unknown';

		if (typeOfPayload === 'unknown') {
			return ({ success: false, status: 400, error: { name: 'INVALID_EMAIL_PAYLOAD', message: 'Invalid email payload type', cause: { type: typeof email } } })
		}

		// Unify email to an array if it is a single object
		const emails: EmailPayload[] = (Array.isArray(email) ? email : (typeof email === 'object') ? [email] : []) as EmailPayload[];

		
		if (emails.length === 0) return ({ success: false, status: 400, error: { name: 'NO_EMAIL', message: 'No email provided' } })


		if (this.emailService) {
			// Verification of the emails
			for (const email of emails) {

				/* Verification of the sender */
				const from = this.emailService.checkFrom(email.from);
				if (!from) return ({ success: false, status: 400, error: { name: 'INVALID_SENDER', message: 'Invalid sender in the email' } })
				if (!isValidEmail(from.email)) return ({ success: false, status: 400, error: { name: 'INVALID_SENDER', message: 'Invalid sender in the email', cause: { from } } })
				email.from = from

				/* Verification of the recipients */

				// Formatting recipient addresses
				email.to = this.emailService.checkRecipients(email.to);
				// Check that there is at least one recipient in the email
				if (!email.to || !Array.isArray(email.to)) return ({ success: false, status: 400, error: { name: 'NO_RECIPIENT', message: 'No recipient in the email' } })
				// Check that there is at least one sender in the email
				if (email.to.length === 0) return ({ success: false, status: 400, error: { name: 'NO_RECIPIENT', message: 'No recipient in the email' } })

				// Email verification:

				const invalidRecipients = checkValidityOfEmails(email.to as Recipient[]);
				if (invalidRecipients.length > 0) return ({ success: false, status: 400, error: { name: 'INVALID_RECIPIENT', message: 'Invalid recipient in the email', cause: invalidRecipients } })

				/* Verification of CC */

				if (email.cc) {
					email.cc = this.emailService.checkRecipients(email.cc);
					const invalidRecipientsCC = checkValidityOfEmails(email.cc as Recipient[]);
					if (invalidRecipientsCC.length > 0) return ({ success: false, status: 400, error: { name: 'INVALID_RECIPIENT', message: 'Invalid recipient in the email', cause: invalidRecipientsCC } })
				}

				/* Verification of BCC */

				if (email.bcc) {
					email.bcc = this.emailService.checkRecipients(email.bcc);
					const invalidRecipientsBCC = checkValidityOfEmails(email.bcc as Recipient[]);
					if (invalidRecipientsBCC.length > 0) return ({ success: false, status: 400, error: { name: 'INVALID_RECIPIENT', message: 'Invalid recipient in the email', cause: invalidRecipientsBCC } })
				}

				const recipients = email.to.concat(email.cc ? email.cc : []).concat(email.bcc ? email.bcc : [])

				// No more than 50 recipients
				if (recipients.length > 50) return ({ success: false, status: 400, error: { name: 'TOO_MANY_RECIPIENTS', message: 'Too many recipients in the email (50 max)', cause: { number: recipients.length, emails: recipients } } })


				// Check that there is a subject in the email
				if (!email.subject) return ({ success: false, status: 400, error: { name: 'NO_SUBJECT', message: 'No subject in the email' } })
				// Check that there is content in the email
				if (!email.html || !email.text) return ({ success: false, status: 400, error: { name: 'NO_CONTENT', message: 'No content in the email' } })
			
			}

			// if one email 
			if (emails.length === 1) {
				const resultat = await this.emailService.sendMail(emails[0])
				if (typeOfPayload === 'object') {
					// If the payload is a single object, return the response directly
					return resultat;
				} else {
					// If the payload is an array, return the response in an array
					return [resultat];
				}
			}
			// Multiple emails
			else if (this.emailService.mailMultiple && this.emailService.mailMultiple === true) {
				// If the email service supports sending multiple emails at by 500 once
				console.log('******** ES-Email ********  Sending multiple emails at once')
				return await this.emailService.sendMailMultiple(emails);

			}
			else {
				// If the email service does not support sending multiple emails at once, send them one by one
				console.log('******** ES-Email ********  Sending multiple emails one by one')
				const responses: StandardResponse[] = [];
				for (const email of emails) {
					const response = await this.emailService.sendMail(email);
					responses.push(response);
				}
				return responses;
			}






		}
		else return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } })
	}

	static async sendEmail(esp: Config, email: EmailPayload): Promise<StandardResponse> {
		const emailServiceSelector = new EmailServiceSelector(esp);
		return await emailServiceSelector.sendEmail(email);
	}

	close() {
		// Nothing, as we are  using only for nodemailer
	}

	static async webHook(esp: string, req: any, logger: boolean = false): Promise<WebHookResponse> {
		if (esp) {
			if (logger) console.log("******** ES-WebHook ******** esp", esp)

			const config: ConfigMinimal = { esp: 'emailserviceviewer', logger: logger };
			switch (esp) {
				case 'Postmark':
					config.esp = 'postmark';
					break;

				case 'nodemailer':
					return ({ success: false, status: 500, error: { name: 'NO_NODEMAILER', message: 'No webhook traitement for nodemailer' } })
					break;

				case 'SendinBlue Webhook':
					config.esp = 'brevo';
					break;

				case 'email-service-viewer':
					config.esp = 'emailserviceviewer';
					break;

				case 'Svix-Webhooks/1.24.0':
					config.esp = 'resend';
					break;

				default:
					return ({ success: false, status: 500, error: { name: 'INVALID_ESP', message: 'No ESP service configured for ' + esp } })
					break;
			}
			if (logger) console.log("******** ES-WebHook ******** config", config)

			// @ts-ignore
			const emailESP = new EmailServiceSelector(config);
			if (logger) console.log("******** ES-WebHook ********  emailESP", emailESP)

			if (emailESP.emailService) { return await emailESP.emailService.webHookManagement(req) }
			else { return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } }) }
		}
		else { return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } }) }
	}
}


export function getEmailService(service: Config): EmailServiceSelector {
	return new EmailServiceSelector(service)
}

export async function getWebHook(userAgent: string, req: any, logger: boolean = false): Promise<WebHookResponse> {
	if (logger) {
		console.log('******** ES-WebHook ******** userAgent, logger', userAgent, logger)
		console.log('******** ES-WebHook ******** req', req)
	}
	return await EmailServiceSelector.webHook(userAgent, req, logger)
}

