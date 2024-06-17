


type ESP = 'postmark' | 'brevo' | 'nodemailer' | 'emailserviceviewer' | 'resend';

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
