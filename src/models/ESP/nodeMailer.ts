import { EmailPayload } from "../../types/email.type";
import { ConfigNodeMailer, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type";
import nodemailer from 'nodemailer'
import { ESP } from "../esp";
import { errorManagement } from "../../utils/error";

export class NodeMailerEmailService extends ESP<ConfigNodeMailer> implements IEmailService {
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
			return { success: true, status: 200, data: message };
		} catch (error) {
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
