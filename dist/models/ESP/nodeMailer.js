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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeMailerEmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const esp_1 = require("../esp");
const error_1 = require("../../utils/error");
class NodeMailerEmailService extends esp_1.ESP {
    constructor(service) {
        super(service);
        this.nodemailerTransporter = nodemailer_1.default.createTransport(service);
    }
    sendMail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const message = yield this.nodemailerTransporter.sendMail(options);
                if (message.error) {
                    return process.exit(1);
                }
                return { success: true, status: 200, data: message };
            }
            catch (error) {
                return { success: false, status: 500, error: (0, error_1.errorManagement)(error) };
            }
        });
    }
    close() {
        if (this.nodemailerTransporter)
            this.nodemailerTransporter.close();
    }
    webHook(req) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
}
exports.NodeMailerEmailService = NodeMailerEmailService;
