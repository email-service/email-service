import { StandardError } from "../../types/error.type";
export const errorCode: { [key: number]: StandardError } = {
	10: { name: 'UNAUTHORIZED', message: 'Unauthorized APIKey not valid' },
	300: { name: 'EMAIL_INVALID', message: 'email not valid' }
};