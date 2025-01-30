"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrevoEmailService = void 0;
const error_js_1 = require("../../utils/error.js");
const transformeHeaders_js_1 = require("../../utils/transformeHeaders.js");
const esp_js_1 = require("../esp.js");
const brevo_errors_js_1 = require("./brevo.errors.js");
const brevo_status_js_1 = require("./brevo.status.js");
//const extractAddressFrom = (destination: string) => destination.match(/<.+@.+>/)?.[0].replace(/[<>]/g, "") || destination
const convertToBrevoAddress = (address) => {
    const a = address.trim();
    if (/.+<.+>$/.test(a)) {
        const tempo = a.match(/(.+)<(.+@.+)>/) || ['', ''];
        return {
            name: tempo[1],
            email: tempo[2]
        };
    }
    else
        return { email: a.replace(/[<>]/g, "") };
};
class BrevoEmailService extends esp_js_1.ESP {
    constructor(service) {
        super(service);
    }
    async sendMail(options) {
        try {
            // Brevo API does not support the "from" field, so we need to extract the email address from the string
            // const toEmail = extractAddressFrom(options.to)
            // const fromEmail = extractAddressFrom(options.from)
            const body = {
                sender: convertToBrevoAddress(options.from),
                to: [convertToBrevoAddress(options.to)],
                subject: options.subject,
                htmlContent: options.html,
                textContent: options.text,
                tags: [options.tag],
                replyTo: convertToBrevoAddress(options.from),
                // Headers: options.headers,
                // TrackOpens: options.trackOpens,
                // TrackLinks: options.trackLinks,
                // Metadata: options.metadata,
                // Attachments: options.attachments
                headers: options.headers ? (0, transformeHeaders_js_1.transformHeaders)(options.headers) : {},
                // 	'X-Mailin-custom': JSON.stringify(options.meta)
                // }
            };
            if (options.metaData) {
                // @ts-ignore
                body.headers = { ...body.headers, 'X-Mailin-custom': JSON.stringify(options.metaData) };
            }
            const opts = {
                method: 'POST', headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.transporter.apiKey
                },
                body: JSON.stringify(body)
            };
            if (this.transporter.logger)
                console.log('******** ES-SendMail Brevo ******** sendMail', body);
            const response = await fetch('https://api.brevo.com/v3/smtp/email', opts);
            if (this.transporter.logger)
                console.log('******** ES-SendMail Brevo ******** response from fetch', response);
            const retour = await response.json();
            if (this.transporter.logger)
                console.log('******** ES-SendMail Brevo ******** json', retour);
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
                if (this.transporter.logger)
                    console.log('******** ES-SendMail Brevo ******** errorCode', brevo_errors_js_1.errorCode[retour.code] || retour.message);
                return { success: false, status: response.status, error: brevo_errors_js_1.errorCode[retour.code] || retour.message };
            }
        }
        catch (error) {
            return { success: false, status: 500, error: (0, error_js_1.errorManagement)(error) };
        }
    }
    async webHookManagement(req) {
        if (this.transporter.logger) {
            console.log('******** ES-WebHook Brevo ******** transporter', this.transporter);
            console.log('******** ES-WebHook Brevo ******** req.event', req.event);
        }
        let result = brevo_status_js_1.webHookStatus[req.event];
        if (result) {
            const nameOfMessageIfForBrevo = 'message-id';
            const data = {
                webHookType: result,
                message: req?.reason,
                messageId: req[nameOfMessageIfForBrevo],
                to: req?.email,
                subject: req?.subject ? req.subject : undefined,
                from: req?.From ? req.From : undefined,
            };
            if (req['X-Mailin-custom']) {
                try {
                    data.metaData = JSON.parse(req['X-Mailin-custom']);
                }
                catch (error) {
                    if (this.transporter.logger)
                        console.log('******** ES-WebHook Brevo ******** error on parse metaData', error);
                }
            }
            if (this.transporter.logger)
                console.log('******** ES-WebHook Brevo ******** result', data);
            return {
                success: true, status: 200, data, espData: {
                    ...req,
                    espRecordType: req?.event,
                    espType: req?.event
                }
            };
        }
        else
            return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } };
    }
}
exports.BrevoEmailService = BrevoEmailService;
//transporter.close();
