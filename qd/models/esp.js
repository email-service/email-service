"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESP = void 0;
class ESP {
    transporter;
    constructor(service) {
        this.transporter = service;
        if (this.transporter.logger)
            console.log('******** ES ********  New Instance of ', this.transporter.esp);
    }
    async sendMail(options) {
        return ({ success: false, status: 500, error: { name: 'NO_METHOD_sendMail', message: 'This function do never to be call, contact the developper' } });
    }
    async webHookManagement(req) {
        return ({ success: false, status: 500, error: { name: 'NO_METHOD_webHookManagement', message: 'This function do never to be call, contact the developper' } });
    }
}
exports.ESP = ESP;
