
import { ESPStandardizedError } from "../../types/error.type.js";
export const errorCode: { [key: number]: ESPStandardizedError } = {
	// Authentication
	10: { name: 'UNAUTHORIZED', category: 'UNAUTHORIZED' },

	// Service
	100: { name: 'MAINTENANCE', category: 'SERVER_EXCEPTION' },

	// Validation
	300: { name: 'EMAIL_INVALID', category: 'EMAIL_INVALID' },
	402: { name: 'INVALID_JSON', category: 'PARAM_INVALID' },
	403: { name: 'INVALID_REQUEST_FIELD', category: 'PARAM_INVALID' },
	409: { name: 'JSON_REQUIRED', category: 'PARAM_INVALID' },
	410: { name: 'TOO_MANY_BATCH_MESSAGES', category: 'PARAM_INVALID' },
	411: { name: 'FORBIDDEN_ATTACHMENT_TYPE', category: 'PARAM_INVALID' },
	813: { name: 'INVALID_EMAIL_OR_DOMAIN', category: 'PARAM_INVALID' },

	// SenderSignature
	400: { name: 'SENDER_SIGNATURE_NOT_FOUND', category: 'PARAM_INVALID' },
	401: { name: 'SENDER_SIGNATURE_NOT_CONFIRMED', category: 'PARAM_INVALID' },
	500: { name: 'SENDER_SIGNATURE_QUERY_EXCEPTION', category: 'PARAM_INVALID' },
	501: { name: 'SENDER_SIGNATURE_NOT_FOUND_BY_ID', category: 'PARAM_INVALID' },
	502: { name: 'NO_UPDATED_SENDER_SIGNATURE_DATA', category: 'PARAM_INVALID' },
	503: { name: 'CANNOT_USE_PUBLIC_DOMAIN', category: 'PARAM_INVALID' },
	504: { name: 'SENDER_SIGNATURE_ALREADY_EXISTS', category: 'PARAM_INVALID' },
	505: { name: 'DKIM_ALREADY_SCHEDULED_FOR_RENEWAL', category: 'PARAM_INVALID' },
	506: { name: 'SENDER_SIGNATURE_ALREADY_CONFIRMED', category: 'PARAM_INVALID' },
	507: { name: 'DO_NOT_OWN_SENDER_SIGNATURE', category: 'PARAM_INVALID' },
	520: { name: 'MISSING_REQUIRED_FIELDS', category: 'PARAM_INVALID' },
	521: { name: 'FIELD_TOO_LONG', category: 'PARAM_INVALID' },
	522: { name: 'INVALID_FIELD_VALUE', category: 'PARAM_INVALID' },

	// Domain
	510: { name: 'DOMAIN_NOT_FOUND', category: 'PARAM_INVALID' },
	511: { name: 'INVALID_FIELDS_SUPPLIED', category: 'PARAM_INVALID' },
	512: { name: 'DOMAIN_ALREADY_EXISTS', category: 'PARAM_INVALID' },
	513: { name: 'DO_NOT_OWN_DOMAIN', category: 'PARAM_INVALID' },
	514: { name: 'NAME_REQUIRED', category: 'PARAM_INVALID' },
	515: { name: 'NAME_TOO_LONG', category: 'PARAM_INVALID' },
	516: { name: 'NAME_FORMAT_INVALID', category: 'PARAM_INVALID' },
	610: { name: 'INVALID_MX_RECORD', category: 'PARAM_INVALID' },
	611: { name: 'INVALID_INBOUND_SPAM_THRESHOLD', category: 'PARAM_INVALID' },

	// Account
	405: { name: 'NOT_ALLOWED_TO_SEND', category: 'ACCOUNT_INVALID' },
	412: { name: 'ACCOUNT_PENDING', category: 'ACCOUNT_INVALID' },
	413: { name: 'ACCOUNT_MAY_NOT_SEND', category: 'ACCOUNT_INVALID' },
	429: { name: 'RATE_LIMIT_EXCEEDED', category: 'ACCOUNT_INVALID' },

	// Server
	600: { name: 'SERVER_QUERY_EXCEPTION', category: 'SERVER_EXCEPTION' },
	602: { name: 'DUPLICATE_INBOUND_DOMAIN', category: 'SERVER_EXCEPTION' },
	603: { name: 'SERVER_NAME_ALREADY_EXISTS', category: 'SERVER_EXCEPTION' },
	604: { name: 'NO_DELETE_ACCESS', category: 'SERVER_EXCEPTION' },
	605: { name: 'UNABLE_TO_DELETE_SERVER', category: 'SERVER_EXCEPTION' },
	606: { name: 'INVALID_WEBHOOK_URL', category: 'SERVER_EXCEPTION' },
	607: { name: 'INVALID_SERVER_COLOR', category: 'SERVER_EXCEPTION' },
	608: { name: 'SERVER_NAME_MISSING_OR_INVALID', category: 'SERVER_EXCEPTION' },
	609: { name: 'NO_UPDATED_SERVER_DATA', category: 'SERVER_EXCEPTION' },

	// Message
	700: { name: 'MESSAGES_QUERY_EXCEPTION', category: 'SERVER_EXCEPTION' },
	701: { name: 'MESSAGE_DOES_NOT_EXIST', category: 'SERVER_EXCEPTION' },
	702: { name: 'BLOCKED_MESSAGE_BYPASS_ERROR', category: 'SERVER_EXCEPTION' },
	703: { name: 'FAILED_MESSAGE_RETRY_ERROR', category: 'SERVER_EXCEPTION' },

	// Trigger
	800: { name: 'TRIGGER_QUERY_EXCEPTION', category: 'SERVER_EXCEPTION' },
	809: { name: 'NO_TRIGGER_DATA_RECEIVED', category: 'SERVER_EXCEPTION' },

	// InboundRule
	810: { name: 'INBOUND_RULE_ALREADY_EXISTS', category: 'SERVER_EXCEPTION' },
	811: { name: 'UNABLE_TO_REMOVE_INBOUND_RULE', category: 'SERVER_EXCEPTION' },
	812: { name: 'INBOUND_RULE_NOT_FOUND', category: 'SERVER_EXCEPTION' },

	// Stats
	900: { name: 'STATS_QUERY_EXCEPTION', category: 'SERVER_EXCEPTION' },

	// Bounce
	1000: { name: 'BOUNCES_QUERY_EXCEPTION', category: 'SERVER_EXCEPTION' },
	1001: { name: 'BOUNCE_NOT_FOUND', category: 'SERVER_EXCEPTION' },
	1002: { name: 'BOUNCE_ID_REQUIRED', category: 'SERVER_EXCEPTION' },
	1003: { name: 'CANNOT_ACTIVATE_BOUNCE', category: 'SERVER_EXCEPTION' },

	// Template
	1100: { name: 'TEMPLATE_QUERY_EXCEPTION', category: 'SERVER_EXCEPTION' },
	1101: { name: 'TEMPLATE_NOT_FOUND', category: 'SERVER_EXCEPTION' },
	1105: { name: 'TEMPLATE_LIMIT_EXCEEDED', category: 'SERVER_EXCEPTION' },
	1109: { name: 'NO_TEMPLATE_DATA_RECEIVED', category: 'SERVER_EXCEPTION' },
	1120: { name: 'MISSING_TEMPLATE_FIELD', category: 'SERVER_EXCEPTION' },
	1121: { name: 'TEMPLATE_FIELD_TOO_LARGE', category: 'SERVER_EXCEPTION' },
	1122: { name: 'INVALID_TEMPLATE_FIELD', category: 'SERVER_EXCEPTION' },
	1123: { name: 'UNALLOWED_TEMPLATE_FIELD', category: 'SERVER_EXCEPTION' },
	1125: { name: 'TEMPLATE_TYPE_MISMATCH', category: 'SERVER_EXCEPTION' },
	1130: { name: 'LAYOUT_DEPENDENT_TEMPLATE_EXISTS', category: 'SERVER_EXCEPTION' },
	1131: { name: 'INVALID_LAYOUT_PLACEHOLDER', category: 'SERVER_EXCEPTION' },

	// MessageStream
	1221: { name: 'INVALID_MESSAGE_STREAM_TYPE', category: 'SERVER_EXCEPTION' },
	1222: { name: 'INVALID_MESSAGE_STREAM_ID', category: 'SERVER_EXCEPTION' },
	1223: { name: 'INVALID_MESSAGE_STREAM_NAME', category: 'SERVER_EXCEPTION' },
	1224: { name: 'MESSAGE_STREAM_NAME_TOO_LONG', category: 'SERVER_EXCEPTION' },
	1225: { name: 'MESSAGE_STREAM_LIMIT_EXCEEDED', category: 'SERVER_EXCEPTION' },
	1226: { name: 'MESSAGE_STREAM_NOT_FOUND', category: 'SERVER_EXCEPTION' },
	1227: { name: 'INVALID_MESSAGE_STREAM_ID_FORMAT', category: 'SERVER_EXCEPTION' },
	1228: { name: 'ONE_INBOUND_STREAM_LIMIT', category: 'SERVER_EXCEPTION' },
	1229: { name: 'CANNOT_ARCHIVE_DEFAULT_STREAM', category: 'SERVER_EXCEPTION' },
	1230: { name: 'MESSAGE_STREAM_ID_EXISTS', category: 'SERVER_EXCEPTION' },
	1231: { name: 'MESSAGE_STREAM_DESCRIPTION_TOO_LONG', category: 'SERVER_EXCEPTION' },
	1232: { name: 'CANNOT_UNARCHIVE_STREAM', category: 'SERVER_EXCEPTION' },
	1233: { name: 'INVALID_MESSAGE_STREAM_ID_PREFIX', category: 'SERVER_EXCEPTION' },
	1234: { name: 'INVALID_MESSAGE_STREAM_DESCRIPTION', category: 'SERVER_EXCEPTION' },
	1235: { name: 'MESSAGE_STREAM_NOT_FOUND_ON_SERVER', category: 'SERVER_EXCEPTION' },
	1236: { name: 'SENDING_NOT_SUPPORTED_ON_STREAM', category: 'SERVER_EXCEPTION' },
	1237: { name: 'RESERVED_ID', category: 'SERVER_EXCEPTION' },

	// DataRemoval
	1300: { name: 'INVALID_DATA_REMOVAL_REQUEST', category: 'PARAM_INVALID' },
	1301: { name: 'INVALID_ID', category: 'PARAM_INVALID' },
	1302: { name: 'NO_DATA_REMOVAL_ACCESS', category: 'PARAM_INVALID' },

	// SuppressionList
	406: { name: 'INACTIVE_RECIPIENT', category: 'INACTIVE_RECIPIENT' }

};



export const supressionListStatus: { [key: string]: ESPStandardizedError } = {
	HardBounce: { name: 'HARD_BOUNCE', category: 'INACTIVE_RECIPIENT' },
	ManualSuppression: { name: 'MANUAL_SUPPRESSION', category: 'INACTIVE_RECIPIENT' },
	SpamComplaint: { name: 'SPAM_COMPLAINT', category: 'INACTIVE_RECIPIENT' },
}

