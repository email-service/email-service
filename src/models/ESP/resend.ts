import { EmailPayload, IEmailService, NormalizedEmailPayload, Recipient, StandardResponse, WebHookResponse, WebHookResponseData, WebHookStatus } from "../../types/email.type.js";
import { ConfigResend } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedError } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { ESP, type ESPOptions } from "../esp.js";
import { webHookStatus } from "./resend.status.js";
import { errorCode } from "./resend.errors.js";
import { toRecordHeaders } from "../../utils/headers.js";



/**
 * Resend n'accepte dans ses tags que des lettres ASCII, des chiffres, `_` et
 * `-` : toute autre valeur fait échouer l'envoi entier (400). On remplace donc
 * les caractères refusés plutôt que de laisser passer une requête vouée à
 * l'échec — la valeur transmise peut donc différer de l'originale (un `@` ou un
 * `.` deviennent `-`), ce qui convient à un identifiant mais pas à une adresse
 * qu'on voudrait relire telle quelle.
 */
function sanitizeTagValue(value: string): string {
	return String(value).replace(/[^A-Za-z0-9_-]/g, '-')
}

/**
 * Convertit `metaData` en tags Resend — seul canal par lequel une information
 * de l'appelant revient dans les webhooks (`data.tags`), les en-têtes
 * personnalisés n'y figurant pas.
 *
 * Les valeurs non scalaires sont ignorées : elles ne survivraient pas à
 * l'assainissement, et un JSON aplati serait illisible au retour. Resend
 * plafonne à 75 tags, dont un est déjà pris par `tag`.
 */
function metaDataToTags(metaData: object | undefined): { name: string, value: string }[] {
	if (!metaData) return []
	return Object.entries(metaData)
		.filter(([, value]) => value !== undefined && value !== null && typeof value !== 'object')
		.slice(0, 74)
		.map(([name, value]) => ({ name: sanitizeTagValue(name), value: sanitizeTagValue(String(value)) }))
}

export class ResendEmailService extends ESP<ConfigResend> implements IEmailService {

	constructor(service: ConfigResend, opts?: ESPOptions) {
		super(service, opts)
	}



	protected async doSendMail(options: NormalizedEmailPayload): Promise<StandardResponse> {

		try {
			// Les adresses sont déjà normalisées par `ESP.sendMail()` : `from` et
			// `to/cc/bcc` sont garantis en Recipient/Recipient[], et `replyTo` est
			// résolu. (Cette normalisation vivait ici jusqu'à la v0.6.2 — Resend
			// était le seul adaptateur à la faire, d'où le `From: undefined` des
			// autres sur une chaîne nue.)
			const body = {

				from: formatFromForResend(options.from),
				to: formatForResend(options.to),
				cc: options.cc ? formatForResend(options.cc) : undefined,
				bcc: options.bcc ? formatForResend(options.bcc) : undefined,
				subject: options.subject,
				html: options.html,
				text: options.text,
				tags: [
					{ name: 'tag', value: sanitizeTagValue(options?.tag ? options.tag : 'DefaultTag') },
					...metaDataToTags(options.metaData),
				],
				reply_to: formatFromForResend(options.replyTo),

				headers: toRecordHeaders(options.headers),


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

		// Resend renvoie les tags dans ses webhooks (`Record<string,string>`) —
		// c'est le seul canal disponible pour retrouver les métadonnées de l'envoi,
		// les en-têtes personnalisés n'y figurant PAS. Le tag technique `tag` est
		// écarté : il porte `options.tag`, pas une métadonnée.
		if (req.data.tags) {
			const { tag, ...meta } = req.data.tags
			if (Object.keys(meta).length > 0) data.metaData = meta
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