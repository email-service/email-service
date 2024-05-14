import { EmailPayload } from "../types/email.type";
import { ConfigNodeMailer, IEmailService } from "../types/emailDispatcher.type";
export declare class NodeMailerEmailService implements IEmailService {
    private transporter;
    constructor(service: ConfigNodeMailer);
    sendMail(options: EmailPayload): Promise<{
        success: boolean;
        error?: any;
    }>;
    close(): void;
}
