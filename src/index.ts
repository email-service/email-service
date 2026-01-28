
// src/index.ts

import { getEmailService, getWebHook, EmailServiceSelector } from "./models/emailServiceSelector.js";
import type { EmailPayload, StandardResponse } from "./types/email.type.js";
import type { Config } from "./types/emailServiceSelector.type.js";

export { getEmailService, getWebHook, EmailServiceSelector }
export type { EmailPayload, StandardResponse, Config }
