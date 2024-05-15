import type { EmailPayload  } from "./email.type";

export type IEmailService = {
	sendMail(options: EmailPayload): Promise<SendMailResponse>;
}

export type SendMailResponse = {
	ok: true,
	retour?: {
		to: string,
		submittedAt: string,
		messageId: string,
		errorCode: number,
		message: string
	}
}
	|
{ ok: false, error: unknown }


export type ConfigPostmark = {
	esp: 'postmark',
	name: string,
	host: string,
	stream: string,
	apiKey: string
}


export type ConfigBrevo = {
	esp: 'brevo',
	name: string,
	host: string,
	port: number,
	apiKey: string
}

export type ConfigNodeMailer = {
	esp: 'nodeMailer',
	name: string,
	host: string,
	port: number,
	auth: {
		user: string,
		pass: string
	}
}

export type Config = ConfigPostmark  | ConfigBrevo | ConfigNodeMailer
