import { sendEmailError } from "../../types/email.type.js";

// Based on Scaleway's documentation and potential error responses.
// This list might need to be expanded as more specific errors are encountered.
// Common Scaleway API errors might include:
// - authentication_failed, token_not_found, invalid_auth_token
// - invalid_argument (for various malformed inputs)
// - quota_exceeded
// - resource_not_found
// - internal_error
// - permission_denied

interface ScalewayApiError {
    message?: string;
    type?: string; // Often indicates the error category
    fields?: any; // For validation errors
    // Other fields might be present depending on the error
}

export class ScalewayError {
    static fromApiError(apiError: ScalewayApiError | any, httpStatus?: number): { name: sendEmailError; message: string } {
        const type = apiError?.type?.toLowerCase();
        const message = apiError?.message || 'Unknown Scaleway API error';

        // More specific checks can be added here based on 'type' or parts of 'message'
        if (type === 'authentication_failed' || type === 'token_not_found' || type === 'invalid_auth_token' || httpStatus === 401 || httpStatus === 403) {
            return { name: 'UNAUTHORIZED', message };
        }
        if (type === 'invalid_argument') {
            // Check for email specific invalid argument if possible from message or fields
            if (message.includes('email') || message.includes('recipient') || message.includes('sender')) {
                return { name: 'EMAIL_INVALID', message };
            }
            return { name: 'PARAM_INVALID', message };
        }
        if (type === 'quota_exceeded') {
            return { name: 'ACCOUNT_INVALID', message: `Quota exceeded: ${message}` }; // Or a more specific error if available
        }
        if (type === 'permission_denied') {
             return { name: 'ACCOUNT_INVALID', message: `Permission issue: ${message}` };
        }
        if (httpStatus && httpStatus >= 500 || type === 'internal_error' || type === 'service_unavailable') {
            return { name: 'SERVER_EXCEPTION', message };
        }

        // Default or less specific errors
        if (message.toLowerCase().includes('inactive recipient')) { // Example, if Scaleway had such a message
            return { name: 'INACTIVE_RECIPIENT', message };
        }

        // Fallback based on HTTP status if type is not very descriptive
        if (httpStatus === 400) {
            return { name: 'PARAM_INVALID', message: `Bad Request: ${message}` };
        }


        // Default fallback
        return { name: 'SERVER_EXCEPTION', message: `Scaleway API Error: ${message}` };
    }
}
