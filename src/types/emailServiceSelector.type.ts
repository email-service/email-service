import type { EmailPayload } from "./email.type.js";
import { ESPStandardizedError, ESPStandardizedWebHook, StandardError } from "./error.type.js";

export type IEmailService = {
	transporter: Config,
	sendMail(options: EmailPayload): Promise<StandardResponse>,
	webHookManagement(req: any): WebHookResponse,
}

export type ESP = 'postmark' | 'brevo' | 'nodemailer' | 'emailserviceviewer' | 'resend';

export type StandardResponse = {
	success: true,
	status: number,
	data: {
		to: string,
		submittedAt: string,
		messageId: string
	}
}
	|
{
	success: false,
	status: number,
	error: StandardError | ESPStandardizedError
}

export type WebHookResponse = {
	success: true,
	status: number,
	data: ESPStandardizedWebHook,
	espData?: any
}
	|
{
	success: false,
	status: number,
	error: StandardError | ESPStandardizedError
}


export type ConfigPostmark = {
	esp: 'postmark',
	name: string,
	host: string,
	stream: string,
	apiKey: string,
	logger?: boolean
}


export type ConfigBrevo = {
	esp: 'brevo',
	name: string,
	host: string,
	apiKey: string,
	logger?: boolean
}

export type ConfigNodeMailer = {
	esp: 'nodemailer',
	name: string,
	host: string,
	port: number,
	secure?: boolean,
	logger?: boolean,
	debug?: boolean,
	auth: {
		user: string,
		pass: string
	}
}


export type ConfigEmailServiceViewer = {
	esp: 'emailserviceviewer',
	name: string,
	host: string,
	apiToken: string,
	webhook: string,
	logger?: boolean
}


export type ConfigResend= {
	esp: 'resend',
	name: string,
	host: string,
	apiKey: string,
	logger?: boolean
}


export type ConfigMinimal = {
	esp: ESP,
	logger?: boolean
}

export type Config = ConfigPostmark | ConfigBrevo | ConfigNodeMailer | ConfigEmailServiceViewer | ConfigResend;
