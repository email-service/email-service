import { EmailPayload } from "../../types/email.type.js";
import { ConfigNodeMailer, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type.js";
import { ESP } from "../esp.js";
export declare class NodeMailerEmailService extends ESP<ConfigNodeMailer> implements IEmailService {
    private nodemailerTransporter;
    constructor(service: ConfigNodeMailer);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    close(): void;
    webHook(req: any): Promise<StandardResponse>;
}
