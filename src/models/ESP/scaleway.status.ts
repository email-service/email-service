// Scaleway Transactional Email API v1alpha1 Email resource has a 'status' field.
// Possible values for email status include:
// "unknown": The email status is unknown.
// "new": The email is new.
// "sending": The email is being sent.
// "sent": The email has been sent.
// "failed": The email sending has failed.
// "canceled": The email sending has been canceled.
//
// These are statuses of the email object within Scaleway's system,
// not necessarily delivery statuses to the recipient's inbox.
// For this library's purpose, we are mainly concerned with whether the API call
// to send the email was successful and what was the immediate status reported by Scaleway.

// The StandardResponse.data.status can reflect these if needed,
// but often "sent" or "accepted" (if API call was 2xx) is sufficient for this library's abstraction.

// No specific status mapping class is strictly necessary here unless
// we need to translate Scaleway's specific statuses into a more abstract set
// beyond what's directly returned or if we need to handle webhook statuses in a complex way.

// For now, we will directly use the status provided by the Scaleway API in the response
// (e.g., responseBody.emails[0].status).
// If more complex mapping or interpretation is needed later, this file can be expanded.

export const SCW_EMAIL_STATUS = {
    UNKNOWN: "unknown",
    NEW: "new",
    SENDING: "sending",
    SENT: "sent",
    FAILED: "failed",
    CANCELED: "canceled",
};

// This file might be used if we need to map webhook event types to our internal system statuses
// For example, mapping Scaleway's 'hard_bounced', 'soft_bounced' to a generic 'BOUNCED' status.
// However, the current webHookManagement in scaleway.ts directly maps to WebHookResponse types.

// If specific logic for interpreting these statuses globally or for more detailed logging/handling
// is required, functions can be added here. For instance:
/*
export function interpretScalewayStatus(scalewayStatus: string): string {
    switch (scalewayStatus) {
        case SCW_EMAIL_STATUS.SENT:
            return "Successfully handed off to Scaleway for delivery.";
        case SCW_EMAIL_STATUS.FAILED:
            return "Scaleway reported failure to send this email.";
        // Add more cases as needed
        default:
            return `Email status: ${scalewayStatus}`;
    }
}
*/

// For now, keeping it simple as the primary status mapping is handled by the success/error of the API call
// and the direct status from the API response.
