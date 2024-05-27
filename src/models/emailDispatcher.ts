import type { EmailPayload } from "../types/email.type";
import type { Config, ConfigMinimal, ESP, IEmailService, StandardResponse } from "../types/emailDispatcher.type";
import { BrevoEmailService } from "./ESP/brevo";
import { ViewerEmailService } from "./ESP/emailService";
import { NodeMailerEmailService } from "./ESP/nodeMailer";
import { PostMarkEmailService } from "./ESP/postMark";

export class EmailDispatcher {
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

			default:
				throw new Error('Invalid ESP');
				break;
		}
	}

	async sendEmail(email: EmailPayload): Promise<StandardResponse> {
		if (this.emailService)
			return await this.emailService.sendMail(email);
		else return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } })
	}

	static async sendEmail(esp: Config, email: EmailPayload): Promise<StandardResponse> {
		const emailDispatcher = new EmailDispatcher(esp);
		return await emailDispatcher.sendEmail(email);
	}

	close() {
		// Nothing, as we are  using only for nodemailer
	}

	static async webHook(esp: string, req: any): Promise<StandardResponse> {
		if (esp) {
			console.log("esp", esp)
			const config: ConfigMinimal = { esp: 'emailserviceviewer' };
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

				default:
					return ({ success: false, status: 500, error: { name: 'INVALID_ESP', message: 'No ESP service configured for ' + esp } })
					break;
			}
			// @ts-ignore
			const emailESP = new EmailDispatcher(config);
			if (emailESP.emailService) { return await emailESP.emailService.webHookManagement(req) }
			else { return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } }) }
		}
		else { return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } }) }
	}
}
