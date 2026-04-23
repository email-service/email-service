import { EmailPayload, IEmailService, Recipient, StandardResponse, WebHookResponse, WebHookResponseData, WebHookStatus } from "../../types/email.type.js";
import { ConfigResend } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedError } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP } from "../esp.js";
import { webHookStatus } from "./resend.status.js";
import { errorCode } from "./resend.errors.js";
import { transformHeaders } from "../../utils/transformeHeaders.js";



export class ResendEmailService extends ESP<ConfigResend> implements IEmailService {

	constructor(service: ConfigResend) {
		super(service)
	}



	async sendMail(options: EmailPayload): Promise<StandardResponse> {

		try {
			// Normalisation des entrées : `from` et `to/cc/bcc` acceptent string | Recipient | Recipient[]
			// via les types EmailPayload. Les formatters internes attendent Recipient/Recipient[] —
			// sans cette étape, un `from: "foo@bar.com"` (string) donnait `undefined` dans le body.
			const fromNormalized = this.checkFrom(options.from)
			if (!fromNormalized) {
				return {
					success: false, status: 400,
					error: { name: 'FROM_REQUIRED', category: 'PARAM_INVALID', cause: { reason: 'from is missing or invalid' } }
				}
			}
			const toNormalized = this.checkRecipients(options.to)
			if (toNormalized.length === 0) {
				return {
					success: false, status: 400,
					error: { name: 'TO_REQUIRED', category: 'PARAM_INVALID', cause: { reason: 'to is missing or invalid' } }
				}
			}
			const ccNormalized = options.cc ? this.checkRecipients(options.cc) : undefined
			const bccNormalized = options.bcc ? this.checkRecipients(options.bcc) : undefined

			const body = {

				from: formatFromForResend(fromNormalized),
				to: formatForResend(toNormalized),
				cc: ccNormalized ? formatForResend(ccNormalized) : undefined,
				bcc: bccNormalized ? formatForResend(bccNormalized) : undefined,
				subject: options.subject,
				html: options.html,
				text: options.text,
				tags: [{ name: 'tag', value: options?.tag ? options.tag : 'DefaultTag' }],
				reply_to: formatFromForResend(fromNormalized),

				headers: options.headers ? transformHeaders(options.headers) : {},


			}

			const opts = {
				method: 'POST', headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + this.transporter.apiKey
				},
				body: JSON.stringify(body)
			};
			if (this.transporter.logger) console.log('******** ES ********  ResendEmailService.sendMail', opts)
			const response = await fetch('https://api.resend.com/emails', opts)
			if (this.transporter.logger) console.log('******** ES ********  ResendEmailService.sendMail - response from fetch', response)
			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES ********  ResendEmailService.sendMail - json', retour)
			if (!(response.status === 200)) {
				// Toujours logguer la réponse brute de Resend en cas d'erreur, même sans logger actif :
				// le mapping d'erreur en aval masque sinon le message réel (domain_not_verified,
				// invalid_api_key, testing_mode_restricted_from_domain…).
				console.log('******** ES ********  ResendEmailService.sendMail - ERROR body from Resend:', response.status, response.statusText, JSON.stringify(retour))
			}
			if (response.status === 200) {
				return {
					success: true,
					status: response.status,
					data: {
						to: options.to,
						cc: options.cc,
						bcc: options.bcc,
						submittedAt: new Date().toISOString(), //Pour acceepter les dates sous forme de string
						messageId: retour.id
					}
				}
			}

			// Resend renvoie { statusCode, name, message } — name est un slug snake_case
			// (ex: validation_error, invalid_api_key). On mappe via resend.errors.ts,
			// et en fallback on conserve le name brut pour ne jamais perdre l'info.
			const mapped = errorCode[retour.name]
			const errorResult: ESPStandardizedError = mapped
				? { ...mapped, cause: { code: retour.name, message: retour.message, statusCode: retour.statusCode } }
				: { name: retour.name || 'UNKNOWN', category: 'SERVER_EXCEPTION', cause: { code: retour.name, message: retour.message, statusCode: retour.statusCode } }

			return {
				success: false, status: response.status,
				error: errorResult
			}

		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}

	async webHookManagement(req: any): Promise<WebHookResponse> {

		const result: WebHookStatus = webHookStatus[req.type]


		const data: WebHookResponseData = {
			webHookType: result,
			message: 'n/a',
			messageId: req.data.email_id,
			to: req.data.to[0],
			subject: req.data.subject,
			from: req.data.from,
		}


		if (result)
			return { success: true, status: 200, data, espData: req }
		else return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }

	}

	async checkServer(name: string, apiKey: string) {
		// Rechercher si le serveur existe

		// Le créer s'il n'existe pas


	}

}


/**
 * Converts recipients to Resend format: ["John Doe <john@example.com>", "Jane Doe <jane@example.com>"]
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns An array of strings formatted for Resend.
 */
function formatForResend(recipients: Recipient[]): string[] {
	return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email);
}


/**
 * Converts recipients to PostMark format: "John Doe <john@example.com>, Jane Doe <jane@example.com>"
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns A string formatted for PostMark.
 */
function formatFromForResend(from: Recipient): string {
	return (from.name ? `${from.name} <${from.email}>` : from.email)
}