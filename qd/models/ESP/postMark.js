"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostMarkEmailService = void 0;
const error_js_1 = require("../../utils/error.js");
const esp_js_1 = require("../esp.js");
const postMark_status_js_1 = require("./postMark.status.js");
const postMark_errors_js_1 = require("./postMark.errors.js");
class PostMarkEmailService extends esp_js_1.ESP {
    constructor(service) {
        super(service);
    }
    async sendMail(options) {
        if (this.transporter.stream === undefined) {
            if (this.transporter.logger)
                console.log('******** ES-SendMail Postmark ********  Stream for ', this.transporter.esp, ' is not defined in the configuration');
            throw new Error('Stream is not defined in the configuration');
        }
        try {
            const body = {
                MessageStream: this.transporter.stream,
                From: options.from,
                To: options.to,
                Subject: options.subject,
                HtmlBody: options.html,
                TextBody: options.text,
                Tag: options.tag,
                ReplyTo: options.from,
                Metadata: options.metaData,
                TrackOpens: options.trackOpens,
                TrackLinks: options.trackLinks,
                Headers: options.headers
            };
            const opts = {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Postmark-Server-Token': this.transporter.apiKey
                },
                body: JSON.stringify(body)
            };
            if (this.transporter.logger)
                console.log('******** ES-SendMail Postmark ******** to ', body.To);
            const response = await fetch('https://api.postmarkapp.com/email', opts);
            if (this.transporter.logger)
                console.log('******** ES-SendMail Postmark ******** response from fetch', response.status, response.statusText);
            const retour = await response.json();
            if (this.transporter.logger)
                console.log('******** ES-SendMail Postmark ******** json', retour.ErrorCode, retour.Message);
            const returneValue = await this.sendMailResultManagement(retour, response, options);
            if (this.transporter.logger)
                console.log('******** ES-SendMail Postmark ******** returneValue', returneValue);
            return returneValue;
        }
        catch (error) {
            return { success: false, status: 500, error: (0, error_js_1.errorManagement)(error) };
        }
    }
    async sendMailResultManagement(retour, response, options) {
        if (retour.ErrorCode === 0) {
            return {
                success: true,
                status: response.status,
                data: {
                    to: retour.To,
                    submittedAt: retour.SubmittedAt, //Pour acceepter les dates sous forme de string
                    messageId: retour.MessageID
                }
            };
        }
        const errorResult = postMark_errors_js_1.errorCode[retour.ErrorCode] || { name: 'UNKNOWN', category: 'Account' };
        errorResult.cause = { code: retour.ErrorCode, message: retour.Message };
        // Traitement du cas particlier de l'erreur 406
        if (retour.ErrorCode === 406) {
            const suppressionInfos = await this.getSuppressionInfos(options.to);
            const errorResult406 = postMark_errors_js_1.supressionListStatus[suppressionInfos.SuppressionReason] || { name: 'UNKNOWN', category: 'Account' };
            return {
                success: false,
                status: response.status,
                error: errorResult406
            };
        }
        return {
            success: false, status: response.status,
            error: errorResult
        };
    }
    getSuppressionInfos = async (address) => {
        const extractAddressFrom = (destination) => destination.match(/<.+@.+>/)?.[0].replace(/[<>]/g, "") || destination;
        try {
            const response = await fetch(`https://api.postmarkapp.com/message-streams/${this.transporter.stream}/suppressions/dump`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Postmark-Server-Token": this.transporter.apiKey
                }
            });
            const result = await response.json();
            return result.Suppressions.find((r) => r.EmailAddress === extractAddressFrom(address));
        }
        catch (error) {
            console.log(error);
        }
    };
    async webHookManagement(req) {
        if (this.transporter.logger) {
            console.log('******** ES-WebHook Postmark ******** transporter', this.transporter);
            console.log('******** ES-WebHook Postmark ******** req', req);
        }
        let result = postMark_status_js_1.webHookStatus[req.RecordType];
        let dump;
        if (req.RecordType === 'Bounce' && req.TypeCode) {
            // @ts-ignore
            const errorValue = postMark_status_js_1.bouncesTypes[req.TypeCode];
            console.log('******** ES-WebHook Postmark ******** errorValue', errorValue);
            if (errorValue)
                result = errorValue.webHookEventType;
            // Aller chercher le dump s'il existe
            if (req?.DumpAvailable && req?.ID) {
                dump = await this.getBounceDump(req.ID);
            }
        }
        const data = {
            webHookType: result,
            message: req?.Description || req?.Details || req?.FirstOpen.toSring() || req?.Plateform || req?.SuppressionReason,
            messageId: req.MessageID,
            to: req?.Recipient ? req.Recipient : req.Email,
            subject: req?.Subject ? req.Subject : undefined,
            from: req?.From ? req.From : undefined,
            dump: dump
        };
        // Manage the metaData
        if (req.Metadata)
            data.metaData = req.Metadata;
        if (this.transporter.logger)
            console.log('******** ES-WebHook Postmark ******** result', data);
        if (result) {
            return {
                success: true,
                status: 200,
                data,
                espData: {
                    ...req,
                    espType: req?.Type ? req.Type : 'Default',
                    espRecordType: req.RecordType,
                }
            };
        }
        else
            return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } };
    }
    getBounceDump = async (id) => {
        try {
            const response = await fetch(`https://api.postmarkapp.com/bounces/${id}/dump`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Postmark-Server-Token": this.transporter.apiKey
                }
            });
            const result = await response.json();
            return result.Body;
        }
        catch (error) {
            return 'No dump available';
        }
    };
}
exports.PostMarkEmailService = PostMarkEmailService;
//transporter.close();
