import { EmailPayload } from "../types/email.type"
import type { Config, IEmailService, StandardResponse } from "../types/emailDispatcher.type"

export class ESP<T extends Config> implements IEmailService {

	transporter: T

	constructor(service: T) {
		this.transporter = service
		console.log('New Instance of ', this.transporter.esp)
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		return ({ success: false, error: { status: 500, name: 'NO_METHOD', message: 'This function do never to be call, contact the developper' } })
	}

	async webHook(req: any): Promise<StandardResponse> {
		return ({ success: false, error: { status: 500, name: 'NO_METHOD', message: 'This function do never to be call, contact the developper' } })
	}

}