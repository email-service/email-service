import type { EmailPayload } from "./email.type";

export type IEmailService = {
<<<<<<< Updated upstream
	sendMail(options: EmailPayload): Promise<SendMailResponse>;
}

export type SendMailResponse =
	{
		ok: true,
		retour?: {
			to: string,
			submittedAt: string,
			messageId: string,
			errorCode: number,
			message: string
		}
=======
	sendMail(options: EmailPayload): Promise<StandardResponse>;
	webHook(req: any): Promise<StandardResponse>;
}

export type StandardResponse = {
	success: true,
	retour: {
		to: string,
		submittedAt: string,
		messageId: string,
		errorCode: number,
		message: string
>>>>>>> Stashed changes
	}
	|
	{
		ok: false,
		error: any
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

<<<<<<< Updated upstream
export type Config = ConfigPostmark | ConfigBrevo | ConfigNodeMailer
=======
export type Config = ConfigPostmark  | ConfigBrevo | ConfigNodeMailer
>>>>>>> Stashed changes
