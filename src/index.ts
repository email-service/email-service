
// src/index.ts

import { getEmailService, getWebHook, getInboundEmail, EmailServiceSelector } from "./models/emailServiceSelector.js";
import type { ESPOptions } from "./models/esp.js";
import type { EmailPayload, StandardResponse, WebHookResponse, Recipient, FromInput, RecipientInput, HeadersPayLoad } from "./types/email.type.js";
import type { InboundResponse, InboundMessage, InboundAttachment } from "./types/inbound.type.js";
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
import { verifyInboundSignature } from "./utils/verifyInboundSignature.js";

export { getEmailService, getWebHook, getInboundEmail, EmailServiceSelector }
export { renderTemplate, injectUnsubscribeHeader, normalizeSuppressionFromWebhook, stripHtml, verifyInboundSignature }
export type { EmailPayload, StandardResponse, WebHookResponse, Config, RateLimitConfig, ESPOptions }
// Sans ces types, le consommateur ne peut pas typer ce qu'il reçoit.
export type { Recipient, FromInput, RecipientInput, HeadersPayLoad }
export type { InboundResponse, InboundMessage, InboundAttachment }
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
