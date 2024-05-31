import { EmailPayload } from "../../types/email.type.js";
import { ConfigEmailServiceViewer, IEmailService, StandardResponse } from "../../types/emailServiceSelector.type.js";
import { ESP } from "../esp.js";
export declare class ViewerEmailService extends ESP<ConfigEmailServiceViewer> implements IEmailService {
    constructor(service: ConfigEmailServiceViewer);
    sendMail(options: EmailPayload): Promise<StandardResponse>;
    webHookManagement(req: any): Promise<StandardResponse>;
}
