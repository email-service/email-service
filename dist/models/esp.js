"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESP = void 0;
class ESP {
    constructor(service) {
        this.transporter = service;
        console.log('New Instance of ', this.transporter.esp);
    }
    sendMail(options) {
        throw new Error("Method not implemented.");
    }
    webHook(req) {
        throw new Error("Method not implemented.");
    }
}
exports.ESP = ESP;
