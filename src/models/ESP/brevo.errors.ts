import { ESPStandardizedError, StandardError } from "../../types/error.type.js";
export const errorCode: { [key: string]: ESPStandardizedError } = {
	// Authentication
	unauthorized: { name: 'UNAUTHORIZED', category: 'UNAUTHORIZED' },

	// Validation
	invalid_parameter: { name: 'INVALID_PARAMETER', category: 'PARAM_INVALID' },
	missing_parameter: { name: 'MISSING_PARAMETER', category: 'PARAM_INVALID' },
	out_of_range: { name: 'OUT_OF_RANGE', category: 'PARAM_INVALID' },
	duplicate_parameter: { name: 'DUPLICATE_PARAMETER', category: 'PARAM_INVALID' },
	duplicate_request: { name: 'DUPLICATE_REQUEST', category: 'PARAM_INVALID' },
	not_acceptable: { name: 'NOT_ACCEPTABLE', category: 'PARAM_INVALID' },
	bad_request: { name: 'BAD_REQUEST', category: 'PARAM_INVALID' },

	// Document
	document_not_found: { name: 'DOCUMENT_NOT_FOUND', category: 'PARAM_INVALID' },

	// Permission
	reseller_permission_denied: { name: 'RESELLER_PERMISSION_DENIED', category: 'UNAUTHORIZED' },
	permission_denied: { name: 'PERMISSION_DENIED', category: 'UNAUTHORIZED' },
	method_not_allowed: { name: 'METHOD_NOT_ALLOWED', category: 'UNAUTHORIZED' },

	// Account
	not_enough_credits: { name: 'NOT_ENOUGH_CREDITS', category: 'UNAUTHORIZED' },
	account_under_validation: { name: 'ACCOUNT_UNDER_VALIDATION', category: 'UNAUTHORIZED' }
};