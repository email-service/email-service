import type { EmailPayload } from "../types/email.type";
import type { Config, IEmailService, StandardResponse } from "../types/emailDispatcher.type";
import { BrevoEmailService } from "./ESP/brevo";
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

			default:
				throw new Error('Invalid ESP');
				break;
		}
	}

	async sendEmail(email: EmailPayload): Promise<StandardResponse> {
		if (this.emailService)
			return await this.emailService.sendMail(email);
		else return ({ success: false, error: { status: 500, name: 'NO_ESP', message: 'No ESP service configured' } })
	}

	static async sendEmail(esp: Config, email: EmailPayload): Promise<StandardResponse> {
		const emailDispatcher = new EmailDispatcher(esp);
		return await emailDispatcher.sendEmail(email);
	}

	close() {
		// Nothing, as we are  using only for nodemailer
	}

	static async webHook(req: any): Promise<StandardResponse> {
		if (req.esp) {
			const emailDispatcher = new EmailDispatcher(req.esp);
			return await emailDispatcher.webHook(req);
		} else {
			return ({ success: false, error: { status: 500, name: 'NO_ESP', message: 'No ESP service configured' } })
		}
	}

	async webHook(req: any): Promise<StandardResponse> {
		if (this.emailService)
			return await this.emailService.webHook(req);
		else return ({ success: false, error: { status: 500, name: 'NO_ESP', message: 'No ESP service configured' } })
	}

}
