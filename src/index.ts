
// src/index.ts

import { getEmailService, getWebHook, EmailServiceSelector } from "./models/emailServiceSelector";
import type { EmailPayload, StandardResponse } from "./types/email.type";
import type { Config } from "./types/emailServiceSelector.type";

export { getEmailService, getWebHook, EmailServiceSelector }
export type { EmailPayload, StandardResponse, Config }
