import { EmailPayload } from "../../types/email.type.js";
import { ConfigNodeMailer, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type.js";
import nodemailer from 'nodemailer'
import { ESP } from "../esp.js";
import { errorManagement } from "../../utils/error.js";

export class NodeMailerEmailService extends ESP<ConfigNodeMailer> implements IEmailService {
	private nodemailerTransporter: nodemailer.Transporter;
	constructor(service: ConfigNodeMailer) {
		super(service)
		console.log ('########### NodeMailerEmailService.constructor')
		this.nodemailerTransporter = nodemailer.createTransport(service)
		console.log ('########### NodeMailerEmailService.constructor - this.nodemailerTransporter end')
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		
		try {
			console.log ('########### NodeMailerEmailService.sendMail')
			const message = await this.nodemailerTransporter.sendMail(options);
			if (message.error) {
				return process.exit(1);
			}
			return { success: true, status: 200, data: message };
		} catch (error) {
			console.log ('########### NodeMailerEmailService.sendMail - error', error)
			return { success: false, status: 500, error: errorManagement(error) };
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
