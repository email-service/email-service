import { EmailPayload } from "../types/email.type";
import { ConfigNodeMailer, IEmailService, SendMailResponse } from "../types/emailDispatcher.type";
export declare class NodeMailerEmailService implements IEmailService {
    private transporter;
    constructor(service: ConfigNodeMailer);
    sendMail(options: EmailPayload): Promise<SendMailResponse>;
    close(): void;
}
