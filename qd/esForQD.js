"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailServiceSelector = exports.getEmailService = void 0;
exports.getWebHook = getWebHook;
const emailServiceSelector_1 = require("./models/emailServiceSelector");
async function getWebHook(userAgent, req, logger = false) {
    const data = await (0, emailServiceSelector_1.getWebHook)(userAgent, req, logger);
    const dataForQD = data.success ? {
        success: data.success,
        status: data.status,
        data: {
            webHookType: data.data.webHookType,
            to: data.data.to,
            from: data.data.from,
            subject: data.data.subject,
            metaData: data.data.metaData,
            dump: data.data.dump,
            espMessageId: data.data.messageId,
            espRecordType: data.espData.espRecordType,
            espType: data.espData.espType
        },
        espData: data.espData
    } : { success: false, status: data.status, error: data.error };
    return dataForQD;
}
// src/index.ts
const emailServiceSelector_js_1 = require("./models/emailServiceSelector.js");
Object.defineProperty(exports, "getEmailService", { enumerable: true, get: function () { return emailServiceSelector_js_1.getEmailService; } });
Object.defineProperty(exports, "EmailServiceSelector", { enumerable: true, get: function () { return emailServiceSelector_js_1.EmailServiceSelector; } });
