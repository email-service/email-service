import type { EmailPayload } from "../types/email.type";
import type { Config, IEmailService, SendMailResponse } from "../types/emailDispatcher.type";
import { NodeMailerEmailService } from "./NodeMailerEmailService";
import { PostMarkEmailService } from "./PostMarkEmailService";

export class EmailDispatcher {
	private emailService: IEmailService | undefined;

	constructor(service: Config) {

		console.log('service.esp', service.esp);
		switch (service.esp) {
			case 'postmark':
				this.emailService = new PostMarkEmailService(service);
				break;

			case 'nodeMailer':
				this.emailService = new NodeMailerEmailService(service);
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

}
