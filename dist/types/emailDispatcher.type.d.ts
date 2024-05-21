import type { EmailPayload } from "./email.type";
export type IEmailService = {
    sendMail(options: EmailPayload): Promise<SendMailResponse>;
};
export type SendMailResponse = {
    ok: true;
    retour?: {
        to: string;
        submittedAt: string;
        messageId: string;
        errorCode: number;
        message: string;
    };
} | {
    ok: false;
    error: any;
};
export type ConfigPostmark = {
    esp: 'postmark';
    name: string;
    host: string;
    stream: string;
    apiKey: string;
};
export type ConfigBrevo = {
    esp: 'brevo';
    name: string;
    host: string;
    apiKey: string;
};
export type ConfigNodeMailer = {
    esp: 'nodemailer';
    name: string;
    host: string;
    port: number;
    auth: {
        user: string;
        pass: string;
    };
};
export type Config = ConfigPostmark | ConfigBrevo | ConfigNodeMailer;
