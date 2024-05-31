import { ESPStandardizedError, StandardError } from "../../types/error.type.js";
export const errorCode: { [key: string]: ESPStandardizedError } = {
	// Authentication
	unauthorized: { name: 'UNAUTHORIZED', category: 'Authentification' },

	// Validation
	invalid_parameter: { name: 'INVALID_PARAMETER', category: 'Validation' },
	missing_parameter: { name: 'MISSING_PARAMETER', category: 'Validation' },
	out_of_range: { name: 'OUT_OF_RANGE', category: 'Validation' },
	duplicate_parameter: { name: 'DUPLICATE_PARAMETER', category: 'Validation' },
	duplicate_request: { name: 'DUPLICATE_REQUEST', category: 'Validation' },
	not_acceptable: { name: 'NOT_ACCEPTABLE', category: 'Validation' },
	bad_request: { name: 'BAD_REQUEST', category: 'Validation' },

	// Campaign
	campaign_processing: { name: 'CAMPAIGN_PROCESSING', category: 'Campaign' },
	campaign_sent: { name: 'CAMPAIGN_SENT', category: 'Campaign' },

	// Document
	document_not_found: { name: 'DOCUMENT_NOT_FOUND', category: 'Document' },

	// Permission
	reseller_permission_denied: { name: 'RESELLER_PERMISSION_DENIED', category: 'Permission' },
	permission_denied: { name: 'PERMISSION_DENIED', category: 'Permission' },
	method_not_allowed: { name: 'METHOD_NOT_ALLOWED', category: 'Permission' },

	// Account
	not_enough_credits: { name: 'NOT_ENOUGH_CREDITS', category: 'Account' },
	account_under_validation: { name: 'ACCOUNT_UNDER_VALIDATION', category: 'Account' }
};