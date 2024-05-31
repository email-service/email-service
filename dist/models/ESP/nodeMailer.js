import nodemailer from 'nodemailer';
import { ESP } from "../esp.js";
import { errorManagement } from "../../utils/error.js";
export class NodeMailerEmailService extends ESP {
    nodemailerTransporter;
    constructor(service) {
        super(service);
        this.nodemailerTransporter = nodemailer.createTransport(service);
    }
    async sendMail(options) {
        try {
            const message = await this.nodemailerTransporter.sendMail(options);
            if (message.error) {
                return process.exit(1);
            }
            return { success: true, status: 200, data: message };
        }
        catch (error) {
            return { success: false, status: 500, error: errorManagement(error) };
        }
    }
    close() {
        if (this.nodemailerTransporter)
            this.nodemailerTransporter.close();
    }
    async webHook(req) {
        throw new Error("Method not implemented.");
    }
}
