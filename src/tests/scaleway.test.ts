import { ScaleWayEmailService } from "../models/ESP/scaleway";
import { EmailPayload, StandardResponse } from "../types/email.type";
import { ConfigScaleway } from "../types/emailServiceSelector.type";

// Mocking global fetch
let mockFetch = jest.fn();
global.fetch = mockFetch as any;


describe('ScaleWayEmailService', () => {
    let service: ScaleWayEmailService;
    const baseConfig: ConfigScaleway = {
        esp: 'scaleway',
        apiKey: 'test-api-key',
        region: 'fr-par',
        logger: false, // Disable logger for cleaner test output
    };

    beforeEach(() => {
        mockFetch.mockReset();
        service = new ScaleWayEmailService(baseConfig);
    });

    const basicEmailPayload: EmailPayload = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test text content',
        html: '<p>Test HTML content</p>',
    };

    test('should send a basic email successfully', async () => {
        const mockResponse = {
            emails: [
                {
                    message_id: 'scaleway-message-id-123',
                    status: 'sent',
                },
            ],
        };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse,
        });

        const response: StandardResponse = await service.sendMail(basicEmailPayload);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const fetchCall = mockFetch.mock.calls[0];
        const fetchUrl = fetchCall[0];
        const fetchOptions = fetchCall[1];

        expect(fetchUrl).toBe('https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails');
        expect(fetchOptions.method).toBe('POST');
        expect(fetchOptions.headers['X-Auth-Token']).toBe('test-api-key');
        expect(fetchOptions.headers['Content-Type']).toBe('application/json');

        const body = JSON.parse(fetchOptions.body);
        expect(body.from.email).toBe('sender@example.com');
        expect(body.to[0].email).toBe('recipient@example.com');
        expect(body.subject).toBe('Test Subject');

        expect(response.success).toBe(true);
        expect(response.status).toBe(200);
        expect(response.data?.messageId).toBe('scaleway-message-id-123');
        expect(response.data?.status).toBe('sent');
    });

    test('should send an email with CC, BCC, and attachments', async () => {
        const emailPayloadWithExtras: EmailPayload = {
            ...basicEmailPayload,
            cc: 'cc@example.com',
            bcc: [{ email: 'bcc1@example.com', name: 'BCC User 1' }, 'bcc2@example.com'],
            attachments: [
                {
                    filename: 'invoice.pdf',
                    content: Buffer.from('pdf-content'),
                    contentType: 'application/pdf',
                },
                 {
                    filename: 'notes.txt',
                    content: 'text file content', // string content
                },
            ],
            metaData: { customerId: "cust123", orderId: "order456" }
        };
         const mockResponse = {
            emails: [ { message_id: 'scaleway-message-id-456', status: 'accepted' } ]
        };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse,
        });

        await service.sendMail(emailPayloadWithExtras);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);

        expect(body.cc).toEqual([{ email: 'cc@example.com', name: undefined }]);
        expect(body.bcc).toEqual([
            { email: 'bcc1@example.com', name: 'BCC User 1' },
            { email: 'bcc2@example.com', name: undefined }
        ]);
        expect(body.attachments).toHaveLength(2);
        expect(body.attachments[0].name).toBe('invoice.pdf');
        expect(body.attachments[0].content_type).toBe('application/pdf');
        expect(body.attachments[0].content).toBe(Buffer.from('pdf-content').toString('base64'));
        expect(body.attachments[1].name).toBe('notes.txt');
        expect(body.attachments[1].content_type).toBe('application/octet-stream'); // Default
        expect(body.attachments[1].content).toBe(Buffer.from('text file content').toString('base64'));
        expect(body.tags).toEqual(expect.arrayContaining(["customerId:cust123", "orderId:order456"]));
    });

    test('should include projectId if provided in config', async () => {
        service = new ScaleWayEmailService({ ...baseConfig, projectId: 'test-project-id' });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ emails: [{ message_id: 'proj-msg-id', status: 'sent' }] }),
        });

        await service.sendMail(basicEmailPayload);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.project_id).toBe('test-project-id');
    });

    test('should handle API error response', async () => {
        const errorResponse = {
            message: 'Invalid API key',
            type: 'authentication_failed',
            code: 40101 // Example Scaleway error code if available
        };
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => errorResponse,
        });

        const response: StandardResponse = await service.sendMail(basicEmailPayload);

        expect(response.success).toBe(false);
        expect(response.status).toBe(401);
        expect(response.error?.name).toBe('UNAUTHORIZED');
        expect(response.error?.message).toBe('Invalid API key');
        expect(response.error?.cause).toEqual(errorResponse);
    });

    test('should handle fetch network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network failure'));

        const response: StandardResponse = await service.sendMail(basicEmailPayload);

        expect(response.success).toBe(false);
        expect(response.status).toBe(500);
        expect(response.error?.name).toBe('NETWORK_ERROR');
        expect(response.error?.message).toBe('Network failure');
    });

    test('constructor should throw error if apiKey is missing', () => {
        expect(() => new ScaleWayEmailService({ ...baseConfig, apiKey: undefined as any }))
            .toThrow("Scaleway API key is missing.");
    });

    test('constructor should throw error if region is missing', () => {
        expect(() => new ScaleWayEmailService({ ...baseConfig, region: undefined as any }))
            .toThrow("Scaleway region is missing.");
    });

    // Placeholder for webhook tests - would require more complex mocking of request objects
    describe('webHookManagement', () => {
        test('should process a "sent" webhook event', async () => {
            const mockReq = {
                body: {
                    event: 'sent',
                    message_id: 'wh-msg-id-sent',
                    email: 'recipient@example.com',
                    date: new Date().toISOString(),
                    // other scaleway specific fields
                }
            };
            const response = await service.webHookManagement(mockReq);
            expect(response.success).toBe(true);
            expect(response.data?.type).toBe('SENT');
            expect(response.data?.messageId).toBe('wh-msg-id-sent');
        });

        test('should process a "hard_bounced" webhook event', async () => {
            const mockReq = {
                body: {
                    event: 'hard_bounced',
                    message_id: 'wh-msg-id-bounce',
                    email: 'recipient@example.com',
                    date: new Date().toISOString(),
                    reason: 'User unknown',
                }
            };
            const response = await service.webHookManagement(mockReq);
            expect(response.success).toBe(true);
            expect(response.data?.type).toBe('BOUNCE');
            expect(response.data?.bounceType).toBe('HardBounce');
            expect(response.data?.messageId).toBe('wh-msg-id-bounce');
        });

        test('should return error for unhandled webhook event type', async () => {
            const mockReq = { body: { event: 'unknown_event' } };
            const response = await service.webHookManagement(mockReq);
            expect(response.success).toBe(false);
            expect(response.error?.name).toBe('INVALID_WEBHOOK_PAYLOAD');
        });

        test('should handle error during webhook processing', async () => {
            const mockReq = {
                body: (() => { throw new Error("Parsing failed") })() // Simulate error during access
            };
             // Adjust service to enable logger to see console output if any for this error
            service = new ScaleWayEmailService({...baseConfig, logger: true });

            // We expect the error to be caught by the try-catch in webHookManagement
            // Forcing an error inside the processing logic:
            const errorThrowingReq = {
                get body() {
                    throw new Error("Simulated access error");
                }
            };

            const response = await service.webHookManagement(errorThrowingReq);
            expect(response.success).toBe(false);
            expect(response.status).toBe(500);
            expect(response.error?.name).toBe('WEBHOOK_PROCESSING_ERROR');
            expect(response.error?.message).toBe('Simulated access error');
        });
    });
});
