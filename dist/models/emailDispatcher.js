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
                return ({ success: false, error: { status: 500, name: 'NO_ESP', message: 'No ESP service configured' } });
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
    static webHook(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.esp) {
                const emailDispatcher = new EmailDispatcher(req.esp);
                return yield emailDispatcher.webHook(req);
            }
            else {
                return ({ success: false, error: { status: 500, name: 'NO_ESP', message: 'No ESP service configured' } });
            }
        });
    }
    webHook(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.emailService)
                return yield this.emailService.webHook(req);
            else
                return ({ success: false, error: { status: 500, name: 'NO_ESP', message: 'No ESP service configured' } });
        });
    }
}
exports.EmailDispatcher = EmailDispatcher;
