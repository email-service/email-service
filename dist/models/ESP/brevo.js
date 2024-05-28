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
exports.BrevoEmailService = void 0;
const error_1 = require("../../utils/error");
const esp_1 = require("../esp");
const brevo_errors_1 = require("./brevo.errors");
class BrevoEmailService extends esp_1.ESP {
    constructor(service) {
        super(service);
    }
    sendMail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = {
                    sender: { email: options.from },
                    to: [{ email: options.to }],
                    subject: options.subject,
                    htmlContent: options.html,
                    textContent: options.text,
                    tags: ['tag-test'],
                    replyTo: { email: options.from },
                    // Headers: options.headers,
                    // TrackOpens: options.trackOpens,
                    // TrackLinks: options.trackLinks,
                    // Metadata: options.metadata,
                    // Attachments: options.attachments
                    headers: {
                        'X-Mailin-custom': JSON.stringify(options.meta)
                    }
                };
                const opts = {
                    method: 'POST', headers: {
                        'Content-Type': 'application/json',
                        'api-key': this.transporter.apiKey
                    },
                    body: JSON.stringify(body)
                };
                console.log('******** ES ********  opts', opts);
                const response = yield fetch(this.transporter.host, opts);
                console.log('******** ES ********  response', response);
                const retour = yield response.json();
                console.log("retour", retour);
                if (response.ok) {
                    return {
                        success: true,
                        status: 200,
                        data: {
                            to: options.to,
                            submittedAt: new Date().toISOString(), //Pour acceepter les dates sous forme de string
                            messageId: retour.messageId
                        }
                    };
                }
                else {
                    return { success: false, status: response.status, error: brevo_errors_1.errorCode[retour.code] || retour.message };
                }
            }
            catch (error) {
                return { success: false, status: 500, error: (0, error_1.errorManagement)(error) };
            }
        });
    }
    webHookManagement(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return { success: false, status: 500, error: { name: 'TO_DEVELOP', message: 'WIP : Work in progress for brevo' } };
        });
    }
}
exports.BrevoEmailService = BrevoEmailService;
//transporter.close();
