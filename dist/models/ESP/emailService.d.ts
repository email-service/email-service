import { EmailPayload } from "../../types/email.type";
import { ConfigEmailServiceViewer, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type";
import { ESP } from "../esp";
export declare class ViewerEmailService extends ESP<ConfigEmailServiceViewer> implements IEmailService {
    constructor(service: ConfigEmailServiceViewer);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHookManagement(req: any): Promise<StandardResponse>;
}
