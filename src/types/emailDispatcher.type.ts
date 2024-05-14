import type { EmailPayload } from "./email.type";

export type IEmailService = {
	sendMail(options: EmailPayload): Promise<{ success: boolean, error?: any }>;
}

export type sendMailResponse = {
	success: true,
	retour: {
		to: string,
		submittedAt: string,
		messageId: string,
		errorCode: number,
		message: string
	}
}
	|
{ success: false, error: unknown }


export type ConfigPostmark = {
	esp: 'postmark',
	name: string,
	host: string,
	port: number,
	stream: string,
	apiKey: string
}

export type ConfigSendgrid = {
	esp: 'sendgrid',
	name: string,
	host: string,
	port: number,
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

export type Config = ConfigPostmark | ConfigSendgrid | ConfigBrevo | ConfigNodeMailer
