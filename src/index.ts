
// src/index.ts

import { getEmailService , EmailServiceSelector} from "./models/emailServiceSelector.js";
import type { EmailPayload } from "./types/email.type.js";
import type {StandardResponse} from "./types/emailServiceSelector.type.js"

export { getEmailService, EmailServiceSelector } 
export type {EmailPayload, StandardResponse}
