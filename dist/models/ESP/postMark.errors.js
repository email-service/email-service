"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorCode = void 0;
exports.errorCode = {
    // Authentication
    10: { name: 'UNAUTHORIZED', category: 'Authentification' },
    // Service
    100: { name: 'MAINTENANCE', category: 'Service' },
    // Validation
    300: { name: 'EMAIL_INVALID', category: 'Validation' },
    402: { name: 'INVALID_JSON', category: 'Validation' },
    403: { name: 'INVALID_REQUEST_FIELD', category: 'Validation' },
    409: { name: 'JSON_REQUIRED', category: 'Validation' },
    410: { name: 'TOO_MANY_BATCH_MESSAGES', category: 'Validation' },
    411: { name: 'FORBIDDEN_ATTACHMENT_TYPE', category: 'Validation' },
    813: { name: 'INVALID_EMAIL_OR_DOMAIN', category: 'Validation' },
    // SenderSignature
    400: { name: 'SENDER_SIGNATURE_NOT_FOUND', category: 'SenderSignature' },
    401: { name: 'SENDER_SIGNATURE_NOT_CONFIRMED', category: 'SenderSignature' },
    500: { name: 'SENDER_SIGNATURE_QUERY_EXCEPTION', category: 'SenderSignature' },
    501: { name: 'SENDER_SIGNATURE_NOT_FOUND_BY_ID', category: 'SenderSignature' },
    502: { name: 'NO_UPDATED_SENDER_SIGNATURE_DATA', category: 'SenderSignature' },
    503: { name: 'CANNOT_USE_PUBLIC_DOMAIN', category: 'SenderSignature' },
    504: { name: 'SENDER_SIGNATURE_ALREADY_EXISTS', category: 'SenderSignature' },
    505: { name: 'DKIM_ALREADY_SCHEDULED_FOR_RENEWAL', category: 'SenderSignature' },
    506: { name: 'SENDER_SIGNATURE_ALREADY_CONFIRMED', category: 'SenderSignature' },
    507: { name: 'DO_NOT_OWN_SENDER_SIGNATURE', category: 'SenderSignature' },
    520: { name: 'MISSING_REQUIRED_FIELDS', category: 'SenderSignature' },
    521: { name: 'FIELD_TOO_LONG', category: 'SenderSignature' },
    522: { name: 'INVALID_FIELD_VALUE', category: 'SenderSignature' },
    // Domain
    510: { name: 'DOMAIN_NOT_FOUND', category: 'Domain' },
    511: { name: 'INVALID_FIELDS_SUPPLIED', category: 'Domain' },
    512: { name: 'DOMAIN_ALREADY_EXISTS', category: 'Domain' },
    513: { name: 'DO_NOT_OWN_DOMAIN', category: 'Domain' },
    514: { name: 'NAME_REQUIRED', category: 'Domain' },
    515: { name: 'NAME_TOO_LONG', category: 'Domain' },
    516: { name: 'NAME_FORMAT_INVALID', category: 'Domain' },
    610: { name: 'INVALID_MX_RECORD', category: 'Domain' },
    611: { name: 'INVALID_INBOUND_SPAM_THRESHOLD', category: 'Domain' },
    // Account
    405: { name: 'NOT_ALLOWED_TO_SEND', category: 'Account' },
    412: { name: 'ACCOUNT_PENDING', category: 'Account' },
    413: { name: 'ACCOUNT_MAY_NOT_SEND', category: 'Account' },
    429: { name: 'RATE_LIMIT_EXCEEDED', category: 'Account' },
    // Server
    600: { name: 'SERVER_QUERY_EXCEPTION', category: 'Server' },
    602: { name: 'DUPLICATE_INBOUND_DOMAIN', category: 'Server' },
    603: { name: 'SERVER_NAME_ALREADY_EXISTS', category: 'Server' },
    604: { name: 'NO_DELETE_ACCESS', category: 'Server' },
    605: { name: 'UNABLE_TO_DELETE_SERVER', category: 'Server' },
    606: { name: 'INVALID_WEBHOOK_URL', category: 'Server' },
    607: { name: 'INVALID_SERVER_COLOR', category: 'Server' },
    608: { name: 'SERVER_NAME_MISSING_OR_INVALID', category: 'Server' },
    609: { name: 'NO_UPDATED_SERVER_DATA', category: 'Server' },
    // Message
    700: { name: 'MESSAGES_QUERY_EXCEPTION', category: 'Message' },
    701: { name: 'MESSAGE_DOES_NOT_EXIST', category: 'Message' },
    702: { name: 'BLOCKED_MESSAGE_BYPASS_ERROR', category: 'Message' },
    703: { name: 'FAILED_MESSAGE_RETRY_ERROR', category: 'Message' },
    // Trigger
    800: { name: 'TRIGGER_QUERY_EXCEPTION', category: 'Trigger' },
    809: { name: 'NO_TRIGGER_DATA_RECEIVED', category: 'Trigger' },
    // InboundRule
    810: { name: 'INBOUND_RULE_ALREADY_EXISTS', category: 'InboundRule' },
    811: { name: 'UNABLE_TO_REMOVE_INBOUND_RULE', category: 'InboundRule' },
    812: { name: 'INBOUND_RULE_NOT_FOUND', category: 'InboundRule' },
    // Stats
    900: { name: 'STATS_QUERY_EXCEPTION', category: 'Stats' },
    // Bounce
    1000: { name: 'BOUNCES_QUERY_EXCEPTION', category: 'Bounce' },
    1001: { name: 'BOUNCE_NOT_FOUND', category: 'Bounce' },
    1002: { name: 'BOUNCE_ID_REQUIRED', category: 'Bounce' },
    1003: { name: 'CANNOT_ACTIVATE_BOUNCE', category: 'Bounce' },
    // Template
    1100: { name: 'TEMPLATE_QUERY_EXCEPTION', category: 'Template' },
    1101: { name: 'TEMPLATE_NOT_FOUND', category: 'Template' },
    1105: { name: 'TEMPLATE_LIMIT_EXCEEDED', category: 'Template' },
    1109: { name: 'NO_TEMPLATE_DATA_RECEIVED', category: 'Template' },
    1120: { name: 'MISSING_TEMPLATE_FIELD', category: 'Template' },
    1121: { name: 'TEMPLATE_FIELD_TOO_LARGE', category: 'Template' },
    1122: { name: 'INVALID_TEMPLATE_FIELD', category: 'Template' },
    1123: { name: 'UNALLOWED_TEMPLATE_FIELD', category: 'Template' },
    1125: { name: 'TEMPLATE_TYPE_MISMATCH', category: 'Template' },
    1130: { name: 'LAYOUT_DEPENDENT_TEMPLATE_EXISTS', category: 'Template' },
    1131: { name: 'INVALID_LAYOUT_PLACEHOLDER', category: 'Template' },
    // MessageStream
    1221: { name: 'INVALID_MESSAGE_STREAM_TYPE', category: 'MessageStream' },
    1222: { name: 'INVALID_MESSAGE_STREAM_ID', category: 'MessageStream' },
    1223: { name: 'INVALID_MESSAGE_STREAM_NAME', category: 'MessageStream' },
    1224: { name: 'MESSAGE_STREAM_NAME_TOO_LONG', category: 'MessageStream' },
    1225: { name: 'MESSAGE_STREAM_LIMIT_EXCEEDED', category: 'MessageStream' },
    1226: { name: 'MESSAGE_STREAM_NOT_FOUND', category: 'MessageStream' },
    1227: { name: 'INVALID_MESSAGE_STREAM_ID_FORMAT', category: 'MessageStream' },
    1228: { name: 'ONE_INBOUND_STREAM_LIMIT', category: 'MessageStream' },
    1229: { name: 'CANNOT_ARCHIVE_DEFAULT_STREAM', category: 'MessageStream' },
    1230: { name: 'MESSAGE_STREAM_ID_EXISTS', category: 'MessageStream' },
    1231: { name: 'MESSAGE_STREAM_DESCRIPTION_TOO_LONG', category: 'MessageStream' },
    1232: { name: 'CANNOT_UNARCHIVE_STREAM', category: 'MessageStream' },
    1233: { name: 'INVALID_MESSAGE_STREAM_ID_PREFIX', category: 'MessageStream' },
    1234: { name: 'INVALID_MESSAGE_STREAM_DESCRIPTION', category: 'MessageStream' },
    1235: { name: 'MESSAGE_STREAM_NOT_FOUND_ON_SERVER', category: 'MessageStream' },
    1236: { name: 'SENDING_NOT_SUPPORTED_ON_STREAM', category: 'MessageStream' },
    1237: { name: 'RESERVED_ID', category: 'MessageStream' },
    // DataRemoval
    1300: { name: 'INVALID_DATA_REMOVAL_REQUEST', category: 'DataRemoval' },
    1301: { name: 'INVALID_ID', category: 'DataRemoval' },
    1302: { name: 'NO_DATA_REMOVAL_ACCESS', category: 'DataRemoval' }
};
