"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendEmailService = void 0;
const error_js_1 = require("../../utils/error.js");
const esp_js_1 = require("../esp.js");
const resend_status_js_1 = require("./resend.status.js");
const postMark_errors_js_1 = require("./postMark.errors.js");
const transformeHeaders_js_1 = require("../../utils/transformeHeaders.js");
class ResendEmailService extends esp_js_1.ESP {
    constructor(service) {
        super(service);
    }
    async sendMail(options) {
        try {
            const body = {
                from: 'romain@resend.demoustier.com', //options.from,
                to: [options.to],
                subject: options.subject,
                html: options.html,
                text: options.text,
                tags: [{ name: 'tag', value: options?.tag ? options.tag : 'DefaultTag' }],
                reply_to: options.from,
                headers: options.headers ? (0, transformeHeaders_js_1.transformHeaders)(options.headers) : {},
            };
            const opts = {
                method: 'POST', headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.transporter.apiKey
                },
                body: JSON.stringify(body)
            };
            if (this.transporter.logger)
                console.log('******** ES ********  ResendEmailService.sendMail', opts);
            const response = await fetch('https://api.resend.com/emails', opts);
            if (this.transporter.logger)
                console.log('******** ES ********  ResendEmailService.sendMail - response from fetch', response);
            const retour = await response.json();
            if (this.transporter.logger)
                console.log('******** ES ********  ResendEmailService.sendMail - json', retour);
            if (response.status === 200) {
                return {
                    success: true,
                    status: response.status,
                    data: {
                        to: options.to,
                        submittedAt: new Date().toISOString(), //Pour acceepter les dates sous forme de string
                        messageId: retour.id
                    }
                };
            }
            console.log('******** ES ********  ResendEmailService.sendMail - retour.ErrorCode', retour.name);
            const errorResult = postMark_errors_js_1.errorCode[retour.ErrorCode] || { name: 'UNKNOWN', category: 'Account' };
            errorResult.cause = { code: retour.ErrorCode, message: retour.Message };
            return {
                success: false, status: response.status,
                error: errorResult
            };
        }
        catch (error) {
            return { success: false, status: 500, error: (0, error_js_1.errorManagement)(error) };
        }
    }
    async webHookManagement(req) {
        const result = resend_status_js_1.webHookStatus[req.type];
        const data = {
            webHookType: result,
            message: 'n/a',
            messageId: req.data.email_id,
            to: req.data.to[0],
            subject: req.data.subject,
            from: req.data.from,
        };
        if (result)
            return { success: true, status: 200, data, espData: req };
        else
            return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } };
    }
    async checkServer(name, apiKey) {
        // Rechercher si le serveur existe
        // Le créer s'il n'existe pas
    }
}
exports.ResendEmailService = ResendEmailService;
//transporter.close();
