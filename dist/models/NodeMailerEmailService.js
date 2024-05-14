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
class NodeMailerEmailService {
    constructor(service) {
        this.transporter = nodemailer_1.default.createTransport({
            host: service.host,
            port: service.port,
            secure: false,
            auth: {
                user: service.auth.user,
                pass: service.auth.pass
            }
        });
        //console.log('Instance of NodeMailerEmailService', this)
    }
    sendMail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const message = yield this.transporter.sendMail(options);
                console.log('message', message);
                if (message.error) {
                    console.log('Error occurred');
                    console.log(message.error.message);
                    return process.exit(1);
                }
                console.log('Message sent successfully!', message.messageId);
                // only needed when using pooled connections
                return { success: true };
            }
            catch (error) {
                console.log('Error occurred', error);
                return { success: false, error };
            }
        });
    }
    close() {
        if (this.transporter)
            this.transporter.close();
    }
}
exports.NodeMailerEmailService = NodeMailerEmailService;
//transporter.close();
