import type { EmailPayload } from "../types/email.type";
import type { Config } from "../types/emailDispatcher.type";
export declare class EmailDispatcher {
    private emailService;
    constructor(service: Config);
    sendEmail(email: EmailPayload): Promise<{
        ok: true;
        retour?: {
            to: string;
            submittedAt: string;
            messageId: string;
            errorCode: number;
            message: string;
        } | undefined;
    } | {
        ok: false;
        error: unknown;
    } | {
        success: boolean;
        error: string;
    }>;
    static sendEmail(esp: Config, email: EmailPayload): Promise<{
        ok: true;
        retour?: {
            to: string;
            submittedAt: string;
            messageId: string;
            errorCode: number;
            message: string;
        } | undefined;
    } | {
        ok: false;
        error: unknown;
    } | {
        success: boolean;
        error: string;
    }>;
    close(): void;
}
