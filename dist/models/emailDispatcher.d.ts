import type { EmailPayload } from "../types/email.type";
import type { Config, SendMailResponse } from "../types/emailDispatcher.type";
export declare class EmailDispatcher {
    private emailService;
    constructor(service: Config);
    sendEmail(email: EmailPayload): Promise<SendMailResponse>;
    static sendEmail(esp: Config, email: EmailPayload): Promise<SendMailResponse>;
    close(): void;
}
