import { EmailPayload } from "../../types/email.type";
import { ConfigBrevo, IEmailService, StandardResponse } from "../../types/emailDispatcher.type";
import { ESP } from "../esp";
export declare class BrevoEmailService extends ESP implements IEmailService {
    constructor(service: ConfigBrevo);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHook(req: any): Promise<StandardResponse>;
}
