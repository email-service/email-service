export type EmailPayload = {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
    meta: object;
};
