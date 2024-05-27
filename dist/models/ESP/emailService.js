"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewerEmailService = void 0;
const error_1 = require("../../utils/error");
const esp_1 = require("../esp");
class ViewerEmailService extends esp_1.ESP {
    constructor(service) {
        super(service);
    }
    sendMail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = {
                    from: options.from,
                    to: options.to,
                    subject: options.subject,
                    htmlBody: options.html,
                    textBody: options.text,
                    tag: 'email-test',
                    // Tag: options.tag,
                    replyTo: 'server@question.direct',
                    //Headers: options.headers,
                    metadata: options.meta,
                    // TrackOpens: options.trackOpens,
                    // TrackLinks: options.trackLinks,
                    // Metadata: options.metadata,
                    // Attachments: options.attachments
                };
                const opts = {
                    method: 'POST', headers: {
                        'Content-Type': 'application/json',
                        'X-Mail-Service-Viewer-Token': this.transporter.apiToken
                    },
                    body: JSON.stringify(body)
                };
                const response = yield fetch(this.transporter.host, opts);
                const retour = yield response.json();
                console.log("retour", retour);
                if (retour.success)
                    return {
                        success: true,
                        status: 200,
                        data: retour
                    };
                else {
                    console.log('Error occurred');
                    return { success: false, status: response.status, error: retour.Message };
                }
            }
            catch (error) {
                return { success: false, status: 500, error: (0, error_1.errorManagement)(error) };
            }
        });
    }
    webHookManagement(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return { success: false, status: 500, error: { name: 'TO_DEVELOP', message: 'WIP : Work in progress for email-service-viewer' } };
        });
    }
}
exports.ViewerEmailService = ViewerEmailService;
//transporter.close();
