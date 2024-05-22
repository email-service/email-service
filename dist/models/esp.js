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
exports.ESP = void 0;
class ESP {
    constructor(service) {
        this.transporter = service;
        console.log('New Instance of ', this.transporter.esp);
    }
    sendMail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return ({ success: false, error: { status: 500, name: 'NO_METHOD', message: 'This function do never to be call, contact the developper' } });
        });
    }
    webHookManagement(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return ({ success: false, error: { status: 500, name: 'NO_METHOD', message: 'This function do never to be call, contact the developper' } });
        });
    }
}
exports.ESP = ESP;
