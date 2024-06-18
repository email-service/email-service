import { EmailPayLoadNodeMailer, IEmailService, StandardResponse } from "../../types/email.type.js";
import { ConfigNodeMailer} from "../../types/emailServiceSelector.type.js";
import nodemailer from 'nodemailer'
import { ESP } from "../esp.js";
import { errorManagement } from "../../utils/error.js";

export class NodeMailerEmailService extends ESP<ConfigNodeMailer> implements IEmailService {
	private nodemailerTransporter: nodemailer.Transporter;
	constructor(service: ConfigNodeMailer) {
		super(service)

		const configForNodeMailer = {
			host: service.host,
			port: service.port,
			secure: service?.secure,
			auth: service?.auth,
			logger: service?.logger,
			debug: service?.debug
		}
		this.nodemailerTransporter = nodemailer.createTransport(configForNodeMailer)
		if (service?.logger) console.log('########### NodeMailerEmailService.constructor - configForNodeMailer', configForNodeMailer)
	}

	async sendMail(options: EmailPayLoadNodeMailer): Promise<StandardResponse> {
	
		try {
			// Verification du logger
			if (this.transporter?.logger) console.log('########### NodeMailerEmailService.sendMail - options', options)
			const message = await this.nodemailerTransporter.sendMail(options);
			if (this.transporter?.logger) console.log('########### NodeMailerEmailService.sendMail - message', message)
			if (message.error) {
				return process.exit(1);
			}
			return { success: true, status: 200, data: message };
		} catch (error) {
			if (this.transporter?.logger) console.log('########### NodeMailerEmailService.sendMail - error', error)
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}

	close() {
		if (this.nodemailerTransporter)
			this.nodemailerTransporter.close();
	}

}
