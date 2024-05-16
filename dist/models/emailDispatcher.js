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
const NodeMailerEmailService_1 = require("./NodeMailerEmailService");
const PostMarkEmailService_1 = require("./PostMarkEmailService");
class EmailDispatcher {
    constructor(service) {
        console.log('service.esp', service.esp);
        switch (service.esp) {
            case 'postmark':
                this.emailService = new PostMarkEmailService_1.PostMarkEmailService(service);
                break;
            case 'nodeMailer':
                this.emailService = new NodeMailerEmailService_1.NodeMailerEmailService(service);
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
                return ({ ok: false, error: 'No email service configured' });
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
}
exports.EmailDispatcher = EmailDispatcher;
