type ESP = 'postmark' | 'brevo' | 'nodemailer' | 'emailserviceviewer' |'emailserviceviewerlocal'| 'resend';

export type ConfigPostmark = {
	esp: 'postmark',
	stream: string,
	apiKey: string,
	logger?: boolean
}

export type ConfigBrevo = {
	esp: 'brevo',
	apiKey: string,
	logger?: boolean
}

export type ConfigNodeMailer = {
	esp: 'nodemailer',
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
	esp: 'emailserviceviewer' | 'emailserviceviewerlocal',
	apiToken: string,
	webhook: string,
	logger?: boolean
}

export type ConfigResend= {
	esp: 'resend',
	apiKey: string,
	logger?: boolean
}

export type ConfigMinimal = {
	esp: ESP,
	logger?: boolean
}

export type Config = ConfigPostmark | ConfigBrevo | ConfigNodeMailer | ConfigEmailServiceViewer | ConfigResend;
