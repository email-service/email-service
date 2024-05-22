import type { EmailPayload } from "./email.type";
import { StandardError } from "./error.type";

export type IEmailService = {
	sendMail(options: EmailPayload): Promise<StandardResponse>;
	webHookManagement(req: any): Promise<StandardResponse>;
}

export type ESP = 'postmark' | 'brevo' | 'nodemailer' | 'emailserviceviewer';

export type StandardResponse = {
	success: true,
	data: {
		to: string,
		submittedAt: string,
		messageId: string
	}
}
	|
{
	success: false,
	error: StandardError 
}


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
	apiKey: string
}

export type ConfigNodeMailer = {
	esp: 'nodemailer',
	name: string,
	host: string,
	port: number,
	auth: {
		user: string,
		pass: string
	}
}


export type ConfigEmailServiceViewer = {
	esp: 'emailserviceviewer',
	name: string,
	host: string,
	apiToken: string
}


export type ConfigMinimal = {
	esp: 'postmark' | 'brevo' | 'nodemailer' | 'emailserviceviewer',
}

export type Config = ConfigPostmark | ConfigBrevo | ConfigNodeMailer | ConfigEmailServiceViewer 
