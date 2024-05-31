import { errorManagement } from "../../utils/error.js";
import { ESP } from "../esp.js";
import { errorCode } from "./postMark.errors.js";
export class PostMarkEmailService extends ESP {
    constructor(service) {
        super(service);
    }
    async sendMail(options) {
        try {
            const body = {
                MessageStream: this.transporter.stream,
                From: options.from,
                To: options.to,
                Subject: options.subject,
                HtmlBody: options.html,
                TextBody: options.text,
                Tag: 'email-test',
                // Tag: options.tag,
                ReplyTo: 'server@question.direct',
                //Headers: options.headers,
                Metadata: options.meta,
                // TrackOpens: options.trackOpens,
                // TrackLinks: options.trackLinks,
                // Metadata: options.metadata,
                // Attachments: options.attachments
                Headers: [{
                        name: 'X-QD-Meta', value: JSON.stringify(options.meta)
                    }]
            };
            const opts = {
                method: 'POST', headers: {
                    'Content-Type': 'application/json',
                    'X-Postmark-Server-Token': this.transporter.apiKey
                },
                body: JSON.stringify(body)
            };
            const response = await fetch(this.transporter.host, opts);
            const retour = await response.json();
            console.log('******** ES ********  response', response);
            console.log("******** ES ********  retour", retour);
            if (retour.ErrorCode === 0) {
                return {
                    success: true,
                    status: response.status,
                    data: {
                        to: retour.To,
                        submittedAt: retour.SubmittedAt, //Pour acceepter les dates sous forme de string
                        messageId: retour.MessageID
                    }
                };
            }
            const errorResult = errorCode[retour.ErrorCode] || { name: 'UNKNOWN', category: 'Account' };
            errorResult.cause = { code: retour.ErrorCode, message: retour.Message };
            return {
                success: false, status: response.status,
                error: errorResult
            };
        }
        catch (error) {
            return { success: false, status: 500, error: errorManagement(error) };
        }
    }
    async webHookManagement(req) {
        return { success: false, status: 500, error: { name: 'TO_DEVELOP', message: 'WIP : Work in progress for postMark' } };
    }
    async checkServer(name, apiKey) {
        // Rechercher si le serveur existe
        // Le créer s'il n'existe pas
    }
}
//transporter.close();
