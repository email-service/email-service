
// src/index.ts

import { getEmailService, getWebHook, EmailServiceSelector } from "./models/emailServiceSelector.js";
import type { EmailPayload, StandardResponse, WebHookResponse } from "./types/email.type.js";
import type { Config } from "./types/emailServiceSelector.type.js";
import type { SuppressionReason, EmailStream } from "./types/bulk.type.js";
import { renderTemplate } from "./utils/templating.js";
import { injectUnsubscribeHeader } from "./utils/unsubscribe.js";
import { normalizeSuppressionFromWebhook } from "./utils/suppressionNormalizer.js";

export { getEmailService, getWebHook, EmailServiceSelector }
export { renderTemplate, injectUnsubscribeHeader, normalizeSuppressionFromWebhook }
export type { EmailPayload, StandardResponse, WebHookResponse, Config }
export type { SuppressionReason, EmailStream }
