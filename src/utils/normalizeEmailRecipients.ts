import { FromInput, Recipient, RecipientInput } from "../types/email.type";

/**
 * Normalizes various email recipient inputs into an array of `{ name, email }` objects.
 *
 * @param to - Can be:
 *   - A string containing a single email address (`"john@example.com"`)
 *   - A string containing multiple emails separated by commas (`"john@example.com, jane@example.com"`)
 *   - A string in the format "Name <email>" (`"John Doe <john@example.com>"`)
 *   - An array of strings mixing these formats
 *   - An object `{ name: string, email: string }`
 *   - An array of objects `{ name: string, email: string }` or a mix of objects and strings
 *
 * @returns An array of normalized `{ name, email }` objects.
 */
export function normalizeRecipients(to: RecipientInput): Recipient[] {
	if (!to) return [];

	if (typeof to === "string") {
		return parseEmailString(to);
	}

	if (Array.isArray(to)) {
		return to.flatMap(item => normalizeRecipients(item));
	}

	if (typeof to === "object" && "email" in to) {
		return [{ name: to.name || undefined, email: to.email }];
	}

	return [];
}

/**
 * Normalizes various email from inputs into an object `{ name, email }`.
 *
 * @param to - Can be:
 *   - A string containing a single email address (`"john@example.com"`)
 *   - A string in the format "Name <email>" (`"John Doe <john@example.com>"`)
 *   - An object `{ name: string, email: string }`
 *
 * @returns An array of normalized `{ name, email }` objects.
 */
export function normalizeFrom(from: FromInput): Recipient | undefined {
	if (!from) return undefined;

	if (typeof from === "string") {
		return parseEmailString(from)[0];
	}

	if (typeof from === "object" && "email" in from) {
		return { name: from.name || undefined, email: from.email };
	}

	return undefined;
}

/**
 * Parses a string containing one or more email addresses and returns an array of `{ name, email }` objects.
 *
 * @param to - A string containing one or more email addresses.
 * @returns An array of normalized `{ name, email }` objects.
 */
function parseEmailString(to: string): Recipient[] {
	return to.split(/,\s*/).map(emailEntry => {
		const match = emailEntry.match(/^(.*?)\s*<(.+?)>$/);
		if (match) {
			return { name: match[1].trim(), email: match[2].trim() };
		}
		return { email: emailEntry.trim() };
	});
}


/**
 * Checks if an email address is valid
 * @param email The email address to validate
 * @returns true if the email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	return emailRegex.test(email);
};

/**
 * Filters out recipients with invalid email addresses
 * @param recipients List of recipients
 * @returns List of recipients with invalid email addresses
 */
export const checkValidityOfEmails = (recipients: Recipient[]): Recipient[] => {
	return recipients.filter(recipient => !isValidEmail(recipient.email));
};