import { EmailPayload } from "../../types/email.type";
import { ConfigNodeMailer, IEmailService, StandardResponse } from "../../types/emailDispatcher.type";
import nodemailer from 'nodemailer'
import { ESP } from "../esp";



export class NodeMailerEmailService extends ESP implements IEmailService {
	private nodemailerTransporter: nodemailer.Transporter;
	constructor(service: ConfigNodeMailer) {
		super(service)
		this.nodemailerTransporter = nodemailer.createTransport(service)
	}
	

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		try {
			const message = await this.nodemailerTransporter.sendMail(options);
			if (message.error) {
				return process.exit(1);
			}
			return { success: true , retour : message};
		} catch (error) {
			console.warn('Error occurred', error);
			return { success: false, error };
		}
	}

	close() {
		if (this.nodemailerTransporter)
			this.nodemailerTransporter.close();
	}

	async webHook(req: any): Promise<StandardResponse> {
		throw new Error("Method not implemented.");
	}
}
