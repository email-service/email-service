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
class PostMarkEmailService extends ESP {
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
                    ReplyTo: 'server@simu.immo',
                    // Headers: options.headers,
                    Headers: [{ name: 'X-QD-Meta', value: JSON.stringify(options.meta)
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
                        ok: true,
                        retour: {
                            to: retour.To,
                            submittedAt: retour.SubmittedAt, //Pour acceepter les dates sous forme de string
                            messageId: retour.MessageID,
                            errorCode: retour.ErrorCode,
                            message: retour.Message,
                        }
                    };
                }
                else {
                    console.log('Error occurred');
                    return { ok: false, error: retour.Message };
                }
            }
            catch (error) {
                console.log('Error occurred', error);
                return { ok: false, error };
            }
        });
    }
    webHook(req) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
}
exports.PostMarkEmailService = PostMarkEmailService;
//transporter.close();