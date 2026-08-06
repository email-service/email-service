import { EmailPayload, IEmailService, NormalizedEmailPayload, Recipient, StandardResponse, WebHookResponse, WebHookResponseData, WebHookStatus } from "../../types/email.type.js";
import { ConfigPostmark } from "../../types/emailServiceSelector.type.js";
import { ESPStandardizedError } from "../../types/error.type.js";
import { errorManagement } from "../../utils/error.js";
import { toPostmarkHeaders } from "../../utils/headers.js";
import { normalizePayload } from "../../utils/normalizePayload.js";
import { extractThreading, normalizeInboundHeaders, toRecipient, toRecipients } from "../../utils/inboundNormalize.js";
import type { InboundMessage, InboundResponse } from "../../types/inbound.type.js";
import { ESP, type ESPOptions } from "../esp.js";
import { webHookStatus, bouncesTypes } from "./postMark.status.js";
import { errorCode, supressionListStatus } from "./postMark.errors.js";
export class PostMarkEmailService extends ESP<ConfigPostmark> implements IEmailService {

	private mailOutbound: [string, string][] = [];

	constructor(service: ConfigPostmark, opts?: ESPOptions) {
		super(service, opts)
		this.mailMultiple = true; // Postmark does not support sending multiple emails in one request


		// TODO HENRI 

		/*
		
		 Recherche dans Postmark la liste des suppressions pour chaque email en erreur 406
		
		 Les mettre dans mailOutbound = [ { email, reason } ]
		*/


	}

	protected async doSendMail(options: NormalizedEmailPayload): Promise<StandardResponse> {

		if (this.transporter.stream === undefined) {
			if (this.transporter.logger) console.log('******** ES-SendMail Postmark ********  Stream for ', this.transporter.esp, ' is not defined in the configuration')
			throw new Error('Stream is not defined in the configuration')
		}


		// TODO HENRI : Tester si l'email est dans la liste des suppressions
		// Si oui, ne pas envoyer et retourner une erreur immédiate

		// this.mailOutbound.find(m => m[0] === (options.to as Recipient[])[0].email)


		try {
			const body = {
				MessageStream: this.transporter.stream,
				From: formatFromForPostMark(options.from),
				To: formatForPostMark(options.to),
				Cc: options.cc ? formatForPostMark(options.cc) : undefined,
				Bcc: options.bcc ? formatForPostMark(options.bcc) : undefined,
				Subject: options.subject,
				HtmlBody: options.html,
				TextBody: options.text,
				Tag: options.tag,
				ReplyTo: formatFromForPostMark(options.replyTo),
				Metadata: options.metaData,
				TrackOpens: options.trackOpens,
				TrackLinks: options.trackLinks,
				Headers: toPostmarkHeaders(options.headers)

			}

			const opts = {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'X-Postmark-Server-Token': this.transporter.apiKey
				},
				body: JSON.stringify(body)
			};
			if (this.transporter.logger) console.log('******** ES-SendMail Postmark ******** to ', body.To)

			const response = await fetch('https://api.postmarkapp.com/email', opts)
			if (this.transporter.logger) console.log('******** ES-SendMail Postmark ******** response from fetch', response.status, response.statusText)

			const retour = await response.json()
			if (this.transporter.logger) console.log('******** ES-SendMail Postmark ******** json', retour.ErrorCode, retour.Message)

			const returnedValue = await this.sendMailResultManagement(retour, response, options)

			if (this.transporter.logger) console.log('******** ES-SendMail Postmark ******** returneValue', returnedValue)
			return returnedValue

		} catch (error) {
			return { success: false, status: 500, error: errorManagement(error) };
		}
	}

	async sendMailMultiple(emails: EmailPayload[]): Promise<StandardResponse[]> {

		const messageStream = this.transporter.stream;
		const apiKey = this.transporter.apiKey;
		const logger = this.transporter.logger;
		const myClass = this

		// Fonction principale qui traite par batchs et agrège les résultats
		async function processInBatches<T, R>(
			data: T[],
			processBatch: (batch: T[], index: number) => Promise<R[]>,
			batchSize = 499
		): Promise<R[]> {
			const results: R[] = [];

			const totalBatches = Math.ceil(data.length / batchSize);

			for (let i = 0; i < totalBatches; i++) {
				const start = i * batchSize;
				const end = start + batchSize;
				const batch = data.slice(start, end);
				console.log(`Processing batch ${batch.length} emails...`);
				const batchResult = await processBatch(batch, i);
				results.push(...batchResult);
			}

			return results;
		}

		async function processBatch(batch: EmailPayload[], index: number): Promise<StandardResponse[]> {
			console.log(`Processing batch ${index + 1}...`);

			// Ce chemin d'envoi ne traverse PAS `ESP.sendMail()` : la normalisation
			// (adresses, `replyTo`, en-têtes) doit donc être demandée explicitement,
			// e-mail par e-mail. Un payload invalide n'est pas envoyé et reçoit son
			// erreur à SA position dans le résultat — d'où `sentPositions`, qui garde
			// la correspondance entre les réponses de Postmark et le lot d'origine.
			const results: StandardResponse[] = new Array(batch.length)
			const emailsToSend = []
			const sentPositions: number[] = []
			const normalizedByPosition: NormalizedEmailPayload[] = new Array(batch.length)

			for (let position = 0; position < batch.length; position++) {
				const normalized = normalizePayload(batch[position])
				if (normalized.error) {
					results[position] = normalized.error
					continue
				}
				const email = normalized.payload!
				normalizedByPosition[position] = email
				const body = {
					MessageStream: messageStream,
					From: formatFromForPostMark(email.from),
					To: formatForPostMark(email.to),
					Cc: email.cc ? formatForPostMark(email.cc) : undefined,
					Bcc: email.bcc ? formatForPostMark(email.bcc) : undefined,
					Subject: email.subject,
					HtmlBody: email.html,
					TextBody: email.text,
					Tag: email.tag,
					ReplyTo: formatFromForPostMark(email.replyTo),
					Metadata: email.metaData,
					TrackOpens: email.trackOpens,
					TrackLinks: email.trackLinks,
					Headers: toPostmarkHeaders(email.headers)

				}
				emailsToSend.push(body)
				sentPositions.push(position)
			}

			if (emailsToSend.length === 0) return results

			const opts = {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'X-Postmark-Server-Token': apiKey
				},
				body: JSON.stringify(emailsToSend)
			};
			if (logger) console.log('******** ES-SendMail Postmark ******** send batch #', index)
			try {
				const response = await fetch('https://api.postmarkapp.com/email/batch', opts)
				if (logger) console.log('******** ES-SendMail Postmark ******** response from fetch', response.status, response.statusText)

				const retours = await response.json()
				if (logger) console.log('******** ES-SendMail Postmark ******** json', retours.ErrorCode, retours.Message)

				// Postmark répond dans l'ordre du tableau envoyé : la réponse k
				// correspond donc à `batch[sentPositions[k]]`. (Auparavant l'index
				// était pris dans `emails`, la liste COMPLÈTE : à partir du second
				// lot, chaque résultat était rapproché du mauvais e-mail.)
				for (let k = 0; k < retours.length; k++) {
					const position = sentPositions[k]
					results[position] = await myClass.sendMailResultManagement(retours[k], response, normalizedByPosition[position]) as StandardResponse
				}

				return results

			} catch (error) {
				// L'échec porte sur la requête entière : chaque e-mail réellement
				// soumis reçoit l'erreur, les invalides gardent la leur.
				const failure = { success: false, status: 500, error: errorManagement(error) } as StandardResponse
				for (const position of sentPositions) results[position] = failure
				return results
			}
		}


		if (this.transporter.stream === undefined) {
			if (this.transporter.logger) console.log('******** ES-SendMail Postmark ********  Stream for ', this.transporter.esp, ' is not defined in the configuration')
			throw new Error('Stream is not defined in the configuration')
		}

		const resultats = processInBatches<EmailPayload, StandardResponse>(emails,
			async (batch: EmailPayload[], index: number): Promise<StandardResponse[]> => {
				return await processBatch(batch, index)
			},
			499)

		return resultats

	}

	/**
	 * Réception Postmark — le cas le plus simple : **tout** est dans le payload
	 * (corps, en-têtes complets, pièces jointes en base64), aucun appel API.
	 */
	async inboundManagement(req: any): Promise<InboundResponse> {
		if (!req || (!req.MessageID && !req.Headers)) {
			return { success: false, status: 400, error: { name: 'NOT_AN_INBOUND_PAYLOAD', message: 'Payload does not look like a Postmark inbound message' } }
		}

		const headers = normalizeInboundHeaders(req.Headers)
		const { inReplyTo, references } = extractThreading(headers)

		const message: InboundMessage = {
			// Le Message-ID RFC vient des en-têtes ; `MessageID` est l'identifiant
			// Postmark, conservé à part pour ses API.
			messageId: headers['message-id'] || req.MessageID,
			espMessageId: req.MessageID,
			inReplyTo,
			references,
			// `OriginalRecipient` porte l'adresse réellement destinataire, y compris
			// la partie « plus » (MailboxHash) où le consommateur encode son routage.
			receivedFor: req.OriginalRecipient ? [req.OriginalRecipient] : undefined,
			from: toRecipient(req.FromFull ?? req.From) as Recipient,
			to: toRecipients(req.ToFull ?? req.To),
			cc: req.CcFull?.length ? toRecipients(req.CcFull) : undefined,
			replyTo: req.ReplyTo ? toRecipient(req.ReplyTo) : undefined,
			subject: req.Subject ?? '',
			html: req.HtmlBody || undefined,
			text: req.TextBody || undefined,
			strippedTextReply: req.StrippedTextReply || undefined,
			headers,
			attachments: (req.Attachments ?? []).map((a: any) => ({
				name: a.Name,
				contentType: a.ContentType,
				contentLength: a.ContentLength,
				content: a.Content,
			})),
			receivedAt: req.Date ? new Date(req.Date).toISOString() : new Date().toISOString(),
			spam: headers['x-spam-status'] || headers['x-spam-score']
				? { status: headers['x-spam-status'], score: headers['x-spam-score'] ? Number(headers['x-spam-score']) : undefined }
				: undefined,
		}

		return { success: true, status: 200, data: [message], espData: req }
	}

	async sendMailResultManagement(retour: any, response: any, options: NormalizedEmailPayload): Promise<StandardResponse> {
		if (retour.ErrorCode === 0) {
			return {
				success: true,
				status: response.status,
				data: {
					to: retour.To,
					cc: retour.Cc,
					bcc: retour.Bcc,
					submittedAt: retour.SubmittedAt, //Pour acceepter les dates sous forme de string
					messageId: retour.MessageID
				}
			}
		}

		const errorResult: ESPStandardizedError = errorCode[retour.ErrorCode] || { name: 'UNKNOWN', category: 'ACCOUNT_INVALID' }
		errorResult.cause = { code: retour.ErrorCode, message: retour.Message }

		// Traitement du cas particlier de l'erreur 406

		if (retour.ErrorCode === 406) {
			const suppressionInfos = await this.getSuppressionInfos(formatForPostMark(options.to))
			const errorResult406: ESPStandardizedError = supressionListStatus[suppressionInfos?.SuppressionReason] || { name: 'UNKNOWN', category: 'ACCOUNT_INVALID' }
			return {
				success: false,
				status: response.status,
				error: errorResult406
			}
		}

		return {
			success: false, status: response.status,
			error: errorResult
		}

	}

	getSuppressionInfos = async (address: string) => {
		const extractAddressFrom = (destination: string) => destination.match(/<.+@.+>/)?.[0].replace(/[<>]/g, "") || destination
		try {
			const response = await fetch(
				`https://api.postmarkapp.com/message-streams/${this.transporter.stream}/suppressions/dump`,
				{
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json",
						"X-Postmark-Server-Token": this.transporter.apiKey
					}
				}
			);
			const result = await response.json();

			type PostMarkSuppression = {
				EmailAddress: string,
				SupressionReason: string,
				Origin: string,
				CreatedAt: Date
			}

			return result.Suppressions.find((r: PostMarkSuppression) => r.EmailAddress === extractAddressFrom(address))
		}
		catch (error) {
			console.log(error)
		}
	}


	async webHookManagement(req: any): Promise<WebHookResponse> {

		if (this.transporter.logger) {
			console.log('******** ES-WebHook Postmark ******** transporter', this.transporter)
			console.log('******** ES-WebHook Postmark ******** req', req)
		}

		let result: WebHookStatus = webHookStatus[req.RecordType]

		let dump: string | undefined

		if (req.RecordType === 'Bounce' && req.TypeCode) {
			// @ts-ignore
			const errorValue = bouncesTypes[req.TypeCode]
			console.log('******** ES-WebHook Postmark ******** errorValue', errorValue)
			if (errorValue)
				result = errorValue.webHookEventType

			// Aller chercher le dump s'il existe
			if (req?.DumpAvailable && req?.ID) {
				dump = await this.getBounceDump(req.ID)
			}
		}

		const data: WebHookResponseData = {
			webHookType: result,
			message: req?.Description || req?.Details || req?.FirstOpen || req?.Plateform || req?.SuppressionReason,
			messageId: req.MessageID,
			to: req?.Recipient ? req.Recipient : req.Email,
			subject: req?.Subject ? req.Subject : undefined,
			from: req?.From ? req.From : undefined,
			dump: dump
		}

		// Manage the metaData
		if (req.Metadata)
			data.metaData = req.Metadata

		if (this.transporter.logger)
			console.log('******** ES-WebHook Postmark ******** result', data)
		if (result) {
			return {
				success: true, status: 200, data, espData: {
					...req,
					espType: req?.Type ? req.Type : 'Default',
					espRecordType: req.RecordType,
				}
			}
		}
		else return { success: false, status: 500, error: { name: 'NO_STATUS_FOR_WEBHOOK', message: 'No status aviable for webhook' } }

	}

	getBounceDump = async (id: string) => {
		try {
			const response = await fetch(
				`https://api.postmarkapp.com/bounces/${id}/dump`,
				{
					headers: {
						"Content-Type": "application/json",
						"Accept": "application/json",
						"X-Postmark-Server-Token": this.transporter.apiKey
					}
				}
			);
			const result = await response.json();


			return result.Body
		}
		catch (error) {
			return 'No dump available'
		}
	}

}


/**
 * Converts recipients to PostMark format: "John Doe <john@example.com>, Jane Doe <jane@example.com>"
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns A string formatted for PostMark.
 */
function formatForPostMark(recipients: Recipient[]): string {
	return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(", ");
}


/**
 * Converts recipients to PostMark format: "John Doe <john@example.com>, Jane Doe <jane@example.com>"
 *
 * @param recipients - Array of `{ name, email }` objects.
 * @returns A string formatted for PostMark.
 */
function formatFromForPostMark(from: Recipient): string {
	return (from.name ? `${from.name} <${from.email}>` : from.email)
}