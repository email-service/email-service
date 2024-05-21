import { EmailPayload } from "../types/email.type";
import type { Config, IEmailService, StandardResponse } from "../types/emailDispatcher.type";
export declare class ESP<T extends Config> implements IEmailService {
    transporter: T;
    constructor(service: T);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHook(req: any): Promise<StandardResponse>;
}
