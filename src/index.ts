
// src/index.ts

import { getEmailService, getWebHook, EmailServiceSelector } from "./models/emailServiceSelector.js";
import type { ESPOptions } from "./models/esp.js";
import type { EmailPayload, StandardResponse, WebHookResponse } from "./types/email.type.js";
import type { Config, RateLimitConfig } from "./types/emailServiceSelector.type.js";
import type {
	SuppressionReason,
	EmailStream,
	BulkPayload,
	BulkPayloadTransactional,
	BulkPayloadMarketing,
	BulkRecipient,
	BulkTemplate,
	BulkReport,
	EmailServiceHooks,
} from "./types/bulk.type.js";
import { renderTemplate } from "./utils/templating.js";
import { injectUnsubscribeHeader } from "./utils/unsubscribe.js";
import { normalizeSuppressionFromWebhook } from "./utils/suppressionNormalizer.js";
import { stripHtml } from "./utils/stripHtml.js";

export { getEmailService, getWebHook, EmailServiceSelector }
export { renderTemplate, injectUnsubscribeHeader, normalizeSuppressionFromWebhook, stripHtml }
export type { EmailPayload, StandardResponse, WebHookResponse, Config, RateLimitConfig, ESPOptions }
export type {
	SuppressionReason,
	EmailStream,
	BulkPayload,
	BulkPayloadTransactional,
	BulkPayloadMarketing,
	BulkRecipient,
	BulkTemplate,
	BulkReport,
	EmailServiceHooks,
}
