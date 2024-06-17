import { EmailPayload, IEmailService, StandardResponse, WebHookResponse } from "../types/email.type.js"
import type { Config } from "../types/emailServiceSelector.type"

export class ESP<T extends Config> implements IEmailService {

	transporter: T

	constructor(service: T) {
		this.transporter = service
		if(this.transporter.logger) console.log('******** ES ********  New Instance of ', this.transporter.esp)
	}

	async sendMail(options: EmailPayload): Promise<StandardResponse> {
		return ({ success: false, status: 500, error: { name: 'NO_METHOD_sendMail', message: 'This function do never to be call, contact the developper' } })
	}

	 async webHookManagement(req: any): Promise<WebHookResponse> {
		return ({ success: false, status: 500, error: { name: 'NO_METHOD_webHookManagement', message: 'This function do never to be call, contact the developper' } })
	}

}