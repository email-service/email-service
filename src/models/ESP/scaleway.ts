import { EmailPayload, IEmailService, StandardResponse, WebHookResponse, Recipient } from "../../types/email.type.js";
import type { ConfigScaleway } from "../../types/emailServiceSelector.type.js";
import { ESP } from "../esp.js";
import { ScalewayError } from "./scaleway.errors.js";

// Definition for the Scaleway API payload
interface ScalewayEmailPayload {
    from: { email: string; name?: string };
    to: { email: string; name?: string }[];
    cc?: { email: string; name?: string }[];
    bcc?: { email: string; name?: string }[];
    subject: string;
    text_content: string;
    html_content: string;
    attachments?: { name: string; content_type: string, content: string }[];
    project_id?: string; // Optional: project_id if needed by API, not in standard EmailPayload
    tags?: string[]; // Optional: tags if needed
}

export class ScaleWayEmailService extends ESP<ConfigScaleway> implements IEmailService {
    private apiKey: string;
    private region: string;
    private projectId?: string;

    constructor(config: ConfigScaleway) {
        super(config);
        if (!config.apiKey) {
            throw new Error("Scaleway API key is missing.");
        }
        if (!config.region) {
            throw new Error("Scaleway region is missing.");
        }
        this.apiKey = config.apiKey;
        this.region = config.region;
        this.projectId = config.projectId; // projectId is optional for Scaleway
        if (this.transporter.logger) console.log('******** ES-Scaleway ******** New Instance of ScaleWayEmailService');
    }

    private recipientToScalewayFormat(recipients: Recipient | Recipient[]): { email: string; name?: string }[] {
        const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
        return recipientArray.map(r => ({ email: r.email, name: r.name }));
    }

    async sendMail(options: EmailPayload): Promise<StandardResponse> {
        if (this.transporter.logger) console.log('******** ES-Scaleway ******** Sending email with options:', JSON.stringify(options, null, 2));

        const fromFormatted = typeof options.from === 'string' ? { email: options.from } : { email: options.from.email, name: options.from.name };

        const apiPayload: ScalewayEmailPayload = {
            from: fromFormatted,
            to: this.recipientToScalewayFormat(options.to),
            subject: options.subject,
            text_content: options.text,
            html_content: options.html,
        };

        if (options.cc) {
            apiPayload.cc = this.recipientToScalewayFormat(options.cc);
        }
        if (options.bcc) {
            apiPayload.bcc = this.recipientToScalewayFormat(options.bcc);
        }

        if (options.attachments) {
            apiPayload.attachments = options.attachments.map(att => ({
                name: att.filename,
                content_type: att.contentType || 'application/octet-stream', // Default content type
                content: att.content.toString('base64'), // Assuming content is Buffer or string
            }));
        }

        if (this.projectId) {
            apiPayload.project_id = this.projectId;
        }

        // Add metadata as tags if present
        if (options.metaData && typeof options.metaData === 'object') {
            apiPayload.tags = Object.entries(options.metaData).map(([key, value]) => `${key}:${value}`);
        }


        const apiUrl = `https://api.scaleway.com/transactional-email/v1alpha1/regions/${this.region}/emails`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'X-Auth-Token': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiPayload),
            });

            const responseBody = await response.json();

            if (this.transporter.logger) {
                console.log('******** ES-Scaleway ******** API Response Status:', response.status);
                console.log('******** ES-Scaleway ******** API Response Body:', JSON.stringify(responseBody, null, 2));
            }

            if (!response.ok) {
                const errorName = ScalewayError.fromApiError(responseBody).name;
                return {
                    success: false,
                    status: response.status,
                    error: { name: errorName, message: responseBody.message || 'Unknown error from Scaleway API', cause: responseBody },
                };
            }

            // Assuming the responseBody for success contains an array of email statuses
            // and we are interested in the first one for a single email send.
            // Adjust if Scaleway returns a single object or a different structure.
            const firstEmailInfo = responseBody.emails && responseBody.emails[0];
            if (firstEmailInfo) {
                 return {
                    success: true,
                    status: response.status,
                    data: {
                        messageId: firstEmailInfo.message_id,
                        status: firstEmailInfo.status, // e.g., "sent", "accepted"
                        // other relevant data from firstEmailInfo can be added here
                    },
                };
            } else {
                 // Fallback if the expected structure is not found
                return {
                    success: true,
                    status: response.status,
                    data: {
                        messageId: "N/A", // Or some other placeholder
                        status: "accepted", // Default or inferred status
                        rawResponse: responseBody, // Include raw response for debugging
                    },
                };
            }

        } catch (error: any) {
            if (this.transporter.logger) console.error('******** ES-Scaleway ******** Error sending email:', error);
            // Network errors or other issues with fetch
            return {
                success: false,
                status: 500, // Generic server error for fetch issues
                error: { name: 'NETWORK_ERROR', message: error.message || 'Failed to send email due to network or fetch error', cause: error },
            };
        }
    }

    // Placeholder for webHookManagement, adapt as needed
    async webHookManagement(req: any): Promise<WebHookResponse> {
        if (this.transporter.logger) console.log('******** ES-Scaleway ******** Webhook request received:', JSON.stringify(req.body, null, 2));
        // Actual implementation would parse req.body based on Scaleway webhook format
        // and map it to WebHookResponse
        try {
            const payload = req.body; // Assuming body is already parsed if using a framework like Express

            // Example: Process a 'sent' event
            if (payload && payload.event === 'sent') {
                return {
                    success: true,
                    status: 200,
                    data: {
                        type: 'SENT',
                        messageId: payload.message_id,
                        recipient: payload.email,
                        timestamp: new Date(payload.date),
                        espData: payload, // Raw data from Scaleway
                    },
                };
            }
            // Example: Process a 'bounced' event
            else if (payload && (payload.event === 'hard_bounced' || payload.event === 'soft_bounced')) {
                 return {
                    success: true,
                    status: 200,
                    data: {
                        type: 'BOUNCE',
                        messageId: payload.message_id,
                        recipient: payload.email,
                        timestamp: new Date(payload.date),
                        bounceType: payload.event === 'hard_bounced' ? 'HardBounce' : 'SoftBounce',
                        bounceReason: payload.reason || 'Unknown bounce reason',
                        espData: payload,
                    },
                };
            }
            // Add more event types as needed (e.g., delivered, opened, clicked, spam_complaint)

            if (this.transporter.logger) console.log('******** ES-Scaleway ******** Unhandled webhook event type or payload:', payload?.event);
            return { success: false, status: 400, error: { name: 'INVALID_WEBHOOK_PAYLOAD', message: 'Unhandled webhook event type or invalid payload' } };

        } catch (error: any) {
            if (this.transporter.logger) console.error('******** ES-Scaleway ******** Error processing webhook:', error);
            return { success: false, status: 500, error: { name: 'WEBHOOK_PROCESSING_ERROR', message: error.message || 'Failed to process webhook' } };
        }
    }
}
