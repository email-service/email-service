import { EmailPayload } from "../../types/email.type";
import { ConfigPostmark, IEmailService, StandardResponse } from "../../types/emailDispatcher.type";
import { ESP } from "../esp";
export declare class PostMarkEmailService extends ESP<ConfigPostmark> implements IEmailService {
    constructor(service: ConfigPostmark);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHookManagement(req: any): Promise<StandardResponse>;
}
