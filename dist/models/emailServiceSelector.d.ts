import type { EmailPayload } from "../types/email.type.js";
import type { Config, StandardResponse } from "../types/emailServiceSelector.type.js";
export declare class EmailServiceSelector {
    private emailService;
    constructor(service: Config);
    sendEmail(email: EmailPayload): Promise<StandardResponse>;
    static sendEmail(esp: Config, email: EmailPayload): Promise<StandardResponse>;
    close(): void;
    static webHook(esp: string, req: any): Promise<StandardResponse>;
}
export declare function getEmailService(service: Config): Promise<EmailServiceSelector>;
