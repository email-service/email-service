import { EmailPayload } from "../types/email.type";
import type { Config, IEmailService, StandardResponse } from "../types/emailDispatcher.type";
export declare class ESP implements IEmailService {
    transporter: Config;
    constructor(service: Config);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHook(req: any): Promise<StandardResponse>;
}
