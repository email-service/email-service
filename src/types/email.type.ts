
import { Config } from "./emailServiceSelector.type";
import { ESPStandardizedError, StandardError } from "./error.type";
import type { BulkPayload, BulkReport } from "./bulk.type.js";
import type { InboundResponse } from "./inbound.type.js";

export type IEmailService = {
	transporter: Config,
	mailMultiple?: boolean,
	sendMail(options: EmailPayload): Promise<StandardResponse>,
	sendBulk(payload: BulkPayload): Promise<BulkReport>,
	webHookManagement(req: any): Promise<WebHookResponse>,
	/** Réception d'un message entrant (≠ webhook d'événement). */
	inboundManagement(req: any, config?: Config): Promise<InboundResponse>,
	checkRecipients(to: RecipientInput): Recipient[],
	checkFrom(from: FromInput): Recipient | undefined,
	sendMailMultiple?: (emails: EmailPayload[]) => Promise<StandardResponse[]>,
}

export type HeadersPayLoad = {
	name: string,
	value: string

}[]

export type Recipient = { name?: string; email: string };
export type RecipientInput = string | string[] | Recipient | (string | Recipient)[];

export type FromInput = string | Recipient;

export type EmailPayload = {
	from: FromInput;
	to: RecipientInput;
	cc?: RecipientInput;
	bcc?: RecipientInput;
	subject: string;
	text: string;
	html: string;
	metaData: object;
	tag?: string;
	trackOpens?: boolean;
	trackLinks?: 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
	headers?: HeadersPayLoad;
	/**
	 * Adresse de réponse. Absent → l'adresse d'expédition (comportement
	 * historique). Accepte les mêmes formes que `from`, donc `"Prénom Nom
	 * <adresse>"` est possible.
	 *
	 * ⚠️ Un en-tête `Reply-To` posé dans `headers` est TOUJOURS retiré au profit
	 * de ce champ (RFC 5322 : le champ apparaît au plus une fois — deux sources
	 * concurrentes laisseraient l'ESP arbitrer).
	 */
	replyTo?: FromInput;
}

/**
 * Payload après passage par `normalizePayload` : toutes les adresses sont
 * garanties sous forme d'objets `Recipient`, `replyTo` est résolu (jamais
 * `undefined`) et les en-têtes sont nettoyés de ceux que la librairie porte
 * elle-même.
 *
 * C'est ce que reçoit chaque `doSendMail` d'adaptateur — un adaptateur n'a donc
 * plus à normaliser quoi que ce soit, ni à se demander si `from` est une chaîne.
 */
export type NormalizedEmailPayload = Omit<EmailPayload, 'from' | 'to' | 'cc' | 'bcc' | 'replyTo'> & {
	from: Recipient;
	replyTo: Recipient;
	to: Recipient[];
	cc?: Recipient[];
	bcc?: Recipient[];
}


export type EmailPayLoadNodeMailer = {
	to: string;
	from: string;
	subject: string;
	text: string;
	html: string;
}

export type StandardResponse = {
	success: true,
	status: number,
	data: {
		to: RecipientInput,
		cc?: RecipientInput,
		bcc?: RecipientInput,
		submittedAt: string,
		messageId: string
	}
}
	|
{
	success: false,
	status: number,
	error: StandardError | ESPStandardizedError
}

export type WebHookResponse = {
	success: true,
	status: number,
	data: WebHookResponseData,
	espData?: any
}
	|
{
	success: false,
	status: number,
	error: StandardError | ESPStandardizedError
}

export type WebHookResponseData = {
	webHookType: WebHookStatus,
	message: string,
	messageId: string,
	to: string,
	from?: string,
	subject?: string,
	metaData?: object,
	dump?: string,
	/** Détail du rebond, renseigné pour SOFT_BOUNCE et HARD_BOUNCE quand l'ESP
	 *  le fournit. Le consommateur y trouve le motif à afficher sans avoir à
	 *  rouvrir la charge utile brute. */
	bounce?: WebHookBounceInfo

}

/**
 * Détail normalisé d'un rebond.
 *
 * `kind` est la nature retenue par la librairie ; elle correspond au
 * `webHookType` (`hard` ↔ HARD_BOUNCE, `soft` ↔ SOFT_BOUNCE) et n'existe ici que
 * pour rendre l'objet auto-porteur.
 *
 * `type` / `subType` sont les valeurs BRUTES du fournisseur, conservées telles
 * quelles : elles varient d'un ESP à l'autre (Resend : `Permanent` /
 * `Transient` + `MailboxFull`, `General`… ; Postmark : `HardBounce`,
 * `SoftBounce`… ; Brevo : pas de sous-type). Ne jamais brancher de logique
 * dessus côté consommateur — c'est le rôle de `kind`.
 */
export type WebHookBounceInfo = {
	kind: 'hard' | 'soft',
	type?: string,
	subType?: string,
	diagnosticCode?: string,
	message?: string
}


export type WebHookStatus =
	'SENDED'
	| 'DELAYED'
	| 'DELIVERED'
	| 'OPENED'
	| 'CLICKED'
	| 'SPAM_COMPLAINT'
	| 'SPAM'
	| 'SOFT_BOUNCE'
	| 'HARD_BOUNCE'
	| 'SUBSCRIPTION_CHANGE'
	| 'REJECTED'

	| 'UNKNOWN'


type MessageStatus =
	'delivered' | 'accepted' | 'rejected'
