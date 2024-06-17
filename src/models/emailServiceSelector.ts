import type { EmailPayload, IEmailService, StandardResponse, WebHookResponse } from "../types/email.type.js";
import type { Config, ConfigMinimal } from "../types/emailServiceSelector.type.js";
import { BrevoEmailService } from "./ESP/brevo.js";
import { ViewerEmailService } from "./ESP/emailService.js";
import { NodeMailerEmailService } from "./ESP/nodeMailer.js";
import { PostMarkEmailService } from "./ESP/postMark.js";
import { ResendEmailService } from "./ESP/resend.js";

export class EmailServiceSelector {
	private emailService: IEmailService | undefined;

	constructor(service: Config) {
		switch (service.esp) {
			case 'postmark':
				this.emailService = new PostMarkEmailService(service);
				break;

			case 'nodemailer':
				this.emailService = new NodeMailerEmailService(service);
				break;

			case 'brevo':
				this.emailService = new BrevoEmailService(service);
				break;

			case 'emailserviceviewer':
				this.emailService = new ViewerEmailService(service);
				break;

			case 'resend':
				this.emailService = new ResendEmailService(service);
				break;

			default:
				throw new Error('Invalid ESP');
				break;
		}
	}

	async sendEmail(email: EmailPayload): Promise<StandardResponse> {
		if (this.emailService) {
			return await this.emailService.sendMail(email);
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

	static webHook(esp: string, req: any, logger: boolean = false): WebHookResponse {
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

			if (emailESP.emailService) { return emailESP.emailService.webHookManagement(req) }
			else { return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } }) }
		}
		else { return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } }) }
	}
}


export function getEmailService(service: Config): EmailServiceSelector {
	return new EmailServiceSelector(service)
}

export function getWebHook(userAgent: string, req: any, logger: boolean = false): WebHookResponse {
	console.log('******** ES-WebHook ******** userAgent, logger', userAgent, logger)
	console.log('******** ES-WebHook ******** req', req)
	return EmailServiceSelector.webHook(userAgent, req, logger)
}
