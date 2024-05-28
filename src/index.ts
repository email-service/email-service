
// src/index.ts

import { getEmailService , EmailServiceSelector} from "./models/emailServiceSelector";
import type { EmailPayload } from "./types/email.type";
import type {StandardResponse} from "./types/emailServiceSelector.type"

export { getEmailService, EmailServiceSelector } 
export type {EmailPayload, StandardResponse}
