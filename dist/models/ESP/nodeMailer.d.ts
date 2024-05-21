import { EmailPayload } from "../../types/email.type";
import { ConfigNodeMailer, IEmailService, StandardResponse } from "../../types/emailDispatcher.type";
import { ESP } from "../esp";
export declare class NodeMailerEmailService extends ESP implements IEmailService {
    private nodemailerTransporter;
    constructor(service: ConfigNodeMailer);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    close(): void;
    webHook(req: any): Promise<StandardResponse>;
}
