import { StandardError } from "../types/error.type";

export function errorManagement(error: unknown): StandardError {
	console.warn('Error occurred', error);
	if (error instanceof Error) return { status: 500, name: error.name, message: error.message };
	else
		return { status: 500, name: 'UNKNOW', message: 'Unknow error' };
} 