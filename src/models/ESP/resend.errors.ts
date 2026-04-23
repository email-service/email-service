import { ESPStandardizedError } from "../../types/error.type.js";

/**
 * Resend API error codes — the `name` field returned by Resend in the body
 * on non-2xx responses. Reference: https://resend.com/docs/api-reference/errors
 *
 * Resend renvoie toujours un JSON du type `{ statusCode, name, message }`
 * où `name` est un slug snake_case (ex: `validation_error`, `invalid_api_key`).
 */
export const errorCode: { [key: string]: ESPStandardizedError } = {
	// Authentication
	missing_api_key: { name: 'MISSING_API_KEY', category: 'UNAUTHORIZED' },
	invalid_api_key: { name: 'INVALID_API_KEY', category: 'UNAUTHORIZED' },
	restricted_api_key: { name: 'RESTRICTED_API_KEY', category: 'UNAUTHORIZED' },

	// Validation (inclut domaine non vérifié, testing mode, from/to invalide)
	validation_error: { name: 'VALIDATION_ERROR', category: 'PARAM_INVALID' },
	missing_required_field: { name: 'MISSING_REQUIRED_FIELD', category: 'PARAM_INVALID' },
	invalid_from_address: { name: 'INVALID_FROM_ADDRESS', category: 'EMAIL_INVALID' },
	invalid_to_address: { name: 'INVALID_TO_ADDRESS', category: 'EMAIL_INVALID' },
	invalid_attachment: { name: 'INVALID_ATTACHMENT', category: 'PARAM_INVALID' },
	invalid_idempotency_key: { name: 'INVALID_IDEMPOTENCY_KEY', category: 'PARAM_INVALID' },
	invalid_idempotent_request: { name: 'INVALID_IDEMPOTENT_REQUEST', category: 'PARAM_INVALID' },
	concurrent_idempotent_request: { name: 'CONCURRENT_IDEMPOTENT_REQUEST', category: 'PARAM_INVALID' },

	// Rate limit / quota
	rate_limit_exceeded: { name: 'RATE_LIMIT_EXCEEDED', category: 'ACCOUNT_INVALID' },
	daily_quota_exceeded: { name: 'DAILY_QUOTA_EXCEEDED', category: 'ACCOUNT_INVALID' },

	// Server
	internal_server_error: { name: 'INTERNAL_SERVER_ERROR', category: 'SERVER_EXCEPTION' },
	application_error: { name: 'APPLICATION_ERROR', category: 'SERVER_EXCEPTION' },

	// Others
	not_found: { name: 'NOT_FOUND', category: 'PARAM_INVALID' },
	method_not_allowed: { name: 'METHOD_NOT_ALLOWED', category: 'PARAM_INVALID' },
	security_error: { name: 'SECURITY_ERROR', category: 'UNAUTHORIZED' },
}
