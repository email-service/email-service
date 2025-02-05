
import { Config } from "./emailServiceSelector.type";
import { ESPStandardizedError, StandardError } from "./error.type";

export type IEmailService = {
	transporter: Config,
	sendMail(options: EmailPayload): Promise<StandardResponse>,
	webHookManagement(req: any): Promise<WebHookResponse>,
	checkRecipients(to: RecipientInput): Recipient[],
	checkFrom(from: FromInput): Recipient | undefined
}

export type HeadersPayLoad = {
	name: string,
	value: string

}[]

export type Recipient = { name?: string; email: string };
export type RecipientInput = string | string[] | Recipient | (string | Recipient)[];

export type FromInput = string | Recipient;

export type EmailPayload = {
	from: FromInput;
	to: RecipientInput;
	cc?: RecipientInput;
	bcc?: RecipientInput;
	subject: string;
	text: string;
	html: string;
	metaData: object;
	tag?: string;
	trackOpens?: boolean;
	trackLinks?: 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
	headers?: HeadersPayLoad;
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
		to: RecipientInput,
		cc?: RecipientInput,
		bcc?: RecipientInput,
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

export type WebHookResponseData = {
	webHookType: WebHookStatus,
	message: string,
	messageId: string,
	to: string,
	from?: string,
	subject?: string,
	metaData?: object,
	dump?: string

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

	| 'UNKNOWN'


type MessageStatus =
	'delivered' | 'accepted' | 'rejected'
