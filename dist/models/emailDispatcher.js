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
exports.EmailDispatcher = void 0;
const brevo_1 = require("./ESP/brevo");
const emailService_1 = require("./ESP/emailService");
const nodeMailer_1 = require("./ESP/nodeMailer");
const postMark_1 = require("./ESP/postMark");
class EmailDispatcher {
    constructor(service) {
        switch (service.esp) {
            case 'postmark':
                this.emailService = new postMark_1.PostMarkEmailService(service);
                break;
            case 'nodemailer':
                this.emailService = new nodeMailer_1.NodeMailerEmailService(service);
                break;
            case 'brevo':
                this.emailService = new brevo_1.BrevoEmailService(service);
                break;
            case 'emailserviceviewer':
                this.emailService = new emailService_1.ViewerEmailService(service);
                break;
            default:
                throw new Error('Invalid ESP');
                break;
        }
    }
    sendEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.emailService)
                return yield this.emailService.sendMail(email);
            else
                return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } });
        });
    }
    static sendEmail(esp, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const emailDispatcher = new EmailDispatcher(esp);
            return yield emailDispatcher.sendEmail(email);
        });
    }
    close() {
        // Nothing, as we are  using only for nodemailer
    }
    static webHook(esp, req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (esp) {
                console.log("esp", esp);
                const config = { esp: 'emailserviceviewer' };
                switch (esp) {
                    case 'Postmark':
                        config.esp = 'postmark';
                        break;
                    case 'nodemailer':
                        return ({ success: false, status: 500, error: { name: 'NO_NODEMAILER', message: 'No webhook traitement for nodemailer' } });
                        break;
                    case 'SendinBlue Webhook':
                        config.esp = 'brevo';
                        break;
                    case 'email-service-viewer':
                        config.esp = 'emailserviceviewer';
                        break;
                    default:
                        return ({ success: false, status: 500, error: { name: 'INVALID_ESP', message: 'No ESP service configured for ' + esp } });
                        break;
                }
                // @ts-ignore
                const emailESP = new EmailDispatcher(config);
                if (emailESP.emailService) {
                    return yield emailESP.emailService.webHookManagement(req);
                }
                else {
                    return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } });
                }
            }
            else {
                return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } });
            }
        });
    }
}
exports.EmailDispatcher = EmailDispatcher;
