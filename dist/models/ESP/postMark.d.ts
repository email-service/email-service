import { EmailPayload } from "../../types/email.type.js";
import { ConfigPostmark, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type.js";
import { ESP } from "../esp.js";
export declare class PostMarkEmailService extends ESP<ConfigPostmark> implements IEmailService {
    constructor(service: ConfigPostmark);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHookManagement(req: any): Promise<StandardResponse>;
    checkServer(name: string, apiKey: string): Promise<void>;
}
