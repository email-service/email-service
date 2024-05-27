import { StandardError } from "../types/error.type";

export function errorManagement(error: unknown): StandardError {
	console.warn('Error occurred', error);
	if (error instanceof Error) return { name: error.name, message: error.message };
	else
		return { name: 'UNKNOW', message: 'Unknow error' };
} 