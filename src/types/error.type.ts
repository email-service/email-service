export type StandardError = {
	name: string, // Error Name / key for translation
	message: string, // Error Message in english
	cause?: string,
	stack?: string
}