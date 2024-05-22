import type { EmailPayload } from "../types/email.type";
import type { Config, StandardResponse } from "../types/emailDispatcher.type";
export declare class EmailDispatcher {
    private emailService;
    constructor(service: Config);
    sendEmail(email: EmailPayload): Promise<StandardResponse>;
    static sendEmail(esp: Config, email: EmailPayload): Promise<StandardResponse>;
    close(): void;
    static webHook(esp: string, req: any): Promise<StandardResponse>;
}
