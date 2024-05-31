import { EmailPayload } from "../../types/email.type.js";
import { ConfigBrevo, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type.js";
import { ESP } from "../esp.js";
export declare class BrevoEmailService extends ESP<ConfigBrevo> implements IEmailService {
    constructor(service: ConfigBrevo);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHookManagement(req: any): Promise<StandardResponse>;
}
