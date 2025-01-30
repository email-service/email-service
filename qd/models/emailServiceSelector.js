"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailServiceSelector = void 0;
exports.getEmailService = getEmailService;
exports.getWebHook = getWebHook;
const brevo_js_1 = require("./ESP/brevo.js");
const emailService_js_1 = require("./ESP/emailService.js");
//import { NodeMailerEmailService } from "./ESP/nodeMailer.js";
const postMark_js_1 = require("./ESP/postMark.js");
const resend_js_1 = require("./ESP/resend.js");
class EmailServiceSelector {
    emailService;
    constructor(service) {
        switch (service.esp) {
            case 'postmark':
                this.emailService = new postMark_js_1.PostMarkEmailService(service);
                break;
            case 'nodemailer':
                //this.emailService = new NodeMailerEmailService(service);
                break;
            case 'brevo':
                this.emailService = new brevo_js_1.BrevoEmailService(service);
                break;
            case 'emailserviceviewer':
                this.emailService = new emailService_js_1.ViewerEmailService(service);
                break;
            case 'emailserviceviewerlocal':
                this.emailService = new emailService_js_1.ViewerEmailService(service);
                break;
            case 'resend':
                this.emailService = new resend_js_1.ResendEmailService(service);
                break;
            default:
                throw new Error('Invalid ESP');
                break;
        }
    }
    async sendEmail(email) {
        if (this.emailService) {
            return await this.emailService.sendMail(email);
        }
        else
            return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } });
    }
    static async sendEmail(esp, email) {
        const emailServiceSelector = new EmailServiceSelector(esp);
        return await emailServiceSelector.sendEmail(email);
    }
    close() {
        // Nothing, as we are  using only for nodemailer
    }
    static async webHook(esp, req, logger = false) {
        if (esp) {
            if (logger)
                console.log("******** ES-WebHook ******** esp", esp);
            const config = { esp: 'emailserviceviewer', logger: logger };
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
                case 'Svix-Webhooks/1.24.0':
                    config.esp = 'resend';
                    break;
                default:
                    return ({ success: false, status: 500, error: { name: 'INVALID_ESP', message: 'No ESP service configured for ' + esp } });
                    break;
            }
            if (logger)
                console.log("******** ES-WebHook ******** config", config);
            // @ts-ignore
            const emailESP = new EmailServiceSelector(config);
            if (logger)
                console.log("******** ES-WebHook ********  emailESP", emailESP);
            if (emailESP.emailService) {
                return await emailESP.emailService.webHookManagement(req);
            }
            else {
                return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } });
            }
        }
        else {
            return ({ success: false, status: 500, error: { name: 'NO_ESP', message: 'No ESP service configured' } });
        }
    }
}
exports.EmailServiceSelector = EmailServiceSelector;
function getEmailService(service) {
    return new EmailServiceSelector(service);
}
async function getWebHook(userAgent, req, logger = false) {
    if (logger) {
        console.log('******** ES-WebHook ******** userAgent, logger', userAgent, logger);
        console.log('******** ES-WebHook ******** req', req);
    }
    return await EmailServiceSelector.webHook(userAgent, req, logger);
}
