import { EmailPayload } from "../../types/email.type";
import { ConfigBrevo, IEmailService, StandardResponse } from "../../types/emailDispatcher.type";
import { ESP } from "../esp";
export declare class BrevoEmailService extends ESP<ConfigBrevo> implements IEmailService {
    constructor(service: ConfigBrevo);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHookManagement(req: any): Promise<StandardResponse>;
}
