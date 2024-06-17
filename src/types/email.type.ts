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
	espRecordType: string,
	espType?: string,
	metaData?: object,

}

export type ESPStandardizedWebHook = {
	webHookType: webHookStatus
	message: string
}

type webHookStatus =
	'SEND'
	| 'OPEN'
	| 'CLICK'
	| 'BOUNCE'
	| 'SPAM'
	| 'UNSUBSCRIBE'
	| 'REJECT'
	| 'INBOUND'
	| 'DELIVERY'
	| 'SPAM_COMPLAINT'
	| 'LINK_CLICK'
	| 'DEFERED'