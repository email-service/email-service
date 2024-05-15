import { EmailPayload } from "../types/email.type";
import { ConfigNodeMailer, IEmailService, SendMailResponse } from "../types/emailDispatcher.type";
import nodemailer from 'nodemailer'



export class NodeMailerEmailService implements IEmailService {
	private transporter: nodemailer.Transporter;
	constructor(service: ConfigNodeMailer) {
		this.transporter = nodemailer.createTransport({
			host: service.host,
			port: service.port,
			secure: false,
			auth: {
				user: service.auth.user,
				pass: service.auth.pass
			}

		})
		//console.log('Instance of NodeMailerEmailService', this)
	}

	async sendMail(options: EmailPayload): Promise<SendMailResponse> {
		try {
			const message = await this.transporter.sendMail(options);
			console.log('message', message)
			if (message.error) {
				console.log('Error occurred');
				console.log(message.error.message);
				return process.exit(1);
			}

			console.log('Message sent successfully!', message.messageId);

			// only needed when using pooled connections
			return { ok: true };
		} catch (error) {
			console.log('Error occurred', error);
			return { ok: false, error };
		}
	}

	close() {
		if (this.transporter)
			this.transporter.close();
	}
}



//transporter.close();