import { Config } from "./emailServiceSelector.type";
import { ESPStandardizedError, StandardError } from "./error.type";

export type IEmailService = {
	transporter: Config,
	sendMail(options: EmailPayload): Promise<StandardResponse>,
	webHookManagement(req: any): Promise<WebHookResponse>,
}



export type EmailPayload = {
	to: string;
	from: string;
	subject: string;
	text: string;
	html: string;
	metaData: object;
	tag?: string;
	trackOpens?: boolean;
	trackLinks?: 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
	headers?: object;
}


export type EmailPayLoadNodeMailer = {
	to: string;
	from: string;
	subject: string;
	text: string;
	html: string;
}

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
	data: WebHookResponseData,
	espData?: any
}
	|
{
	success: false,
	status: number,
	error: StandardError | ESPStandardizedError
}

export type WebHookResponseData = ESPStandardizedWebHook & {
	messageId: string,
	to: string,
	from?: string,
	subject?: string,
	metaData?: object,
	dump?: string

}

 type ESPStandardizedWebHook = {
	webHookType: WebHookStatus
	message: string
}

export type WebHookStatus =
	'SENDED'
	| 'DELAYED'
	| 'DELIVERED'
	| 'OPENED'
	| 'CLICKED'
	| 'SPAM_COMPLAINT'
	| 'SPAM'
	| 'SOFT_BOUNCE'
	| 'HARD_BOUNCE'
	| 'SUBSCRIPTION_CHANGE'
	| 'REJECTED'


type MessageStatus =
	'delivered' | 'accepted' | 'rejected'
