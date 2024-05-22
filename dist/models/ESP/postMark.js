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
exports.PostMarkEmailService = void 0;
const error_1 = require("../../utils/error");
const esp_1 = require("../esp");
class PostMarkEmailService extends esp_1.ESP {
    constructor(service) {
        super(service);
    }
    sendMail(options) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const response = yield fetch(this.transporter.host, opts);
                const retour = yield response.json();
                console.log("retour", retour);
                if (retour.ErrorCode === 0) {
                    return {
                        success: true,
                        data: {
                            to: retour.To,
                            submittedAt: retour.SubmittedAt, //Pour acceepter les dates sous forme de string
                            messageId: retour.MessageID
                        }
                    };
                }
                const errorCode = {
                    10: { status: 401, name: 'UNAUTHORIZED', message: 'Unauthorized APIKey not valid' },
                    300: { status: 422, name: 'EMAIL_INVALID', message: 'email not valid' }
                };
                return { success: false, error: errorCode[retour.ErrorCode] || retour.Message };
            }
            catch (error) {
                return { success: false, error: (0, error_1.errorManagement)(error) };
            }
        });
    }
    webHookManagement(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return { success: false, error: { status: 500, name: 'TO_DEVELOP', message: 'WIP : Work in progress for postMark' } };
        });
    }
}
exports.PostMarkEmailService = PostMarkEmailService;
//transporter.close();
