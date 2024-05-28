import { EmailPayload } from "../../types/email.type";
import { ConfigPostmark, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type";
import { ESP } from "../esp";
export declare class PostMarkEmailService extends ESP<ConfigPostmark> implements IEmailService {
    constructor(service: ConfigPostmark);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHookManagement(req: any): Promise<StandardResponse>;
    checkServer(name: string, apiKey: string): Promise<void>;
}
