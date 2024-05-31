import { EmailPayload } from "../types/email.type.js"
import type { Config, IEmailService, StandardResponse } from "../types/emailServiceSelector.type.js"

export class ESP<T extends Config> implements IEmailService {

	transporter: T

	constructor(service: T) {
		this.transporter = service
		console.log('******** ES ********  New Instance of ', this.transporter.esp)
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		return ({ success: false, status: 500, error: { name: 'NO_METHOD', message: 'This function do never to be call, contact the developper' } })
	}

	async webHookManagement(req: any): Promise<StandardResponse> {
		return ({ success: false, status: 500, error: { name: 'NO_METHOD', message: 'This function do never to be call, contact the developper' } })
	}

}