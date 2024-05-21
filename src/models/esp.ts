import { EmailPayload } from "../types/email.type"
import type { Config, IEmailService, StandardResponse } from "../types/emailDispatcher.type"

export class ESP implements IEmailService {

	transporter: Config

	constructor(service: Config) {
		this.transporter = service
		console.log('New Instance of ', this.transporter.esp)
	}

	sendMail(options: EmailPayload): Promise<StandardResponse> {
		throw new Error("Method not implemented.")
	}

	webHook(req: any): Promise<StandardResponse> {
		throw new Error("Method not implemented.")
	}

}