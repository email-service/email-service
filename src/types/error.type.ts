export type ErrorType = {
	ok: true,
	status: number,
	data: any,
	meta?: any
} | {
	ok: false
	status: number,
	error: StandardError;
}

export type StandardError = {
	name: string, // Error Name / key for translation
	message: string, // Error Message in english
	cause?: string | object,
	stack?: string
}

export type ESPStandardizedError = {
	name: string
	cause?: string | object,
	stack?: string,
	category: Category
}


type Category =
	| 'UNAUTHORIZED'
	| 'EMAIL_INVALID'
	| 'PARAM_INVALID'
	| 'ACCOUNT_INVALID'
	| 'INACTIVE_RECIPIENT'
	| 'SERVER_EXCEPTION'

export type ESPStandardizedWebHook = {
	webHookType: webHookStatus
	message: string
	metaData?:object
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