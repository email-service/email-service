import type { EmailPayload } from "../types/email.type";
import type { Config } from "../types/emailDispatcher.type";
export declare class EmailDispatcher {
    private emailService;
    constructor(service: Config);
    sendEmail(email: EmailPayload): Promise<{
        success: boolean;
        error?: any;
    }>;
    static sendEmail(esp: Config, email: EmailPayload): Promise<{
        success: boolean;
        error?: any;
    }>;
    close(): void;
}
