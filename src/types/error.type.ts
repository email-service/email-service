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
