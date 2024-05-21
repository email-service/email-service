import type { EmailPayload } from "../types/email.type";
<<<<<<< Updated upstream
import type { Config, IEmailService, SendMailResponse } from "../types/emailDispatcher.type";
import { NodeMailerEmailService } from "./NodeMailerEmailService";
import { PostMarkEmailService } from "./PostMarkEmailService";
=======
import type { Config, IEmailService } from "../types/emailDispatcher.type";
import { BrevoEmailService } from "./ESP/brevo";
import { NodeMailerEmailService } from "./ESP/nodeMailer";
import { PostMarkEmailService } from "./ESP/postMark";
>>>>>>> Stashed changes

export class EmailDispatcher {
	private emailService: IEmailService | undefined;

	constructor(service: Config) {
		switch (service.esp) {
			case 'postmark':
				this.emailService = new PostMarkEmailService(service);
				break;

			case 'nodeMailer':
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

	async sendEmail(email: EmailPayload) :Promise<SendMailResponse>{
		if (this.emailService)
			return await this.emailService.sendMail(email);
		else return ({ ok: false, error: 'No email service configured' })
	}

	static async sendEmail(esp: Config, email: EmailPayload) {
		const emailDispatcher = new EmailDispatcher(esp);
		return await emailDispatcher.sendEmail(email);
	}

	close() {
		// Nothing, as we are  using only for nodemailer
	}

	static async webHook( req: any) {
		if (req.esp) {
			const emailDispatcher = new EmailDispatcher(req.esp);
			return await emailDispatcher.webHook(req);
		} else {
			return ({ success: false, error: 'No email service configured' })
		}
	}

	async webHook(req: any) {
		if (this.emailService)
			return await this.emailService.webHook(req);
		else return ({ success: false, error: 'No email service configured' })
	}

}
