import { EmailPayload } from "../types/email.type";
import { ConfigPostmark, IEmailService, SendMailResponse } from "../types/emailDispatcher.type";
export declare class PostMarkEmailService implements IEmailService {
    private transporter;
    constructor(service: ConfigPostmark);
    sendMail(options: EmailPayload): Promise<SendMailResponse>;
}
