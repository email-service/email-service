
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
