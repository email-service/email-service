
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
