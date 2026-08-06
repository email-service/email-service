import { vi } from 'vitest'
import { getEmailService } from '../../src/models/emailServiceSelector.js'
import type { Config } from '../../src/types/emailServiceSelector.type.js'
import type { EmailPayload } from '../../src/types/email.type.js'

/**
 * Remplace `fetch` par un espion qui n'atteint jamais le réseau et retourne une
 * réponse de succès plausible pour chaque ESP.
 *
 * C'est le cœur du dispositif de test : on n'éprouve pas les ESP, on éprouve le
 * **body que la librairie leur construit**. C'est exactement ce qui manquait —
 * le format d'en-têtes invalide de Postmark et le `From: undefined` sur une
 * chaîne nue vivaient depuis des mois faute de ce contrôle.
 */
export function captureFetch() {
	const calls: { url: string, body: any, headers: Record<string, string> }[] = []

	const fake = vi.fn(async (url: any, opts: any) => {
		calls.push({
			url: String(url),
			body: opts?.body ? JSON.parse(opts.body) : undefined,
			headers: opts?.headers ?? {},
		})

		// Postmark répond un tableau sur /email/batch, un objet sinon.
		const isPostmarkBatch = String(url).includes('/email/batch')
		const payload = isPostmarkBatch
			? [{ ErrorCode: 0, MessageID: 'id-batch-1', To: 'x@y.z', SubmittedAt: '2026-08-06T00:00:00Z' }]
			: { ErrorCode: 0, MessageID: 'id-1', To: 'x@y.z', SubmittedAt: '2026-08-06T00:00:00Z', messageId: 'id-1', id: 'id-1', success: true, data: { messageId: 'id-1' } }

		return {
			ok: true,
			status: 200,
			statusText: 'OK',
			json: async () => payload,
		} as any
	})

	vi.stubGlobal('fetch', fake)
	return { calls, fake }
}

/** Configurations minimales, une par ESP, sans rate limit gênant. */
export const CONFIGS: Record<string, Config> = {
	postmark: { esp: 'postmark', apiKey: 'test-key', stream: 'outbound' } as Config,
	resend: { esp: 'resend', apiKey: 'test-key' } as Config,
	brevo: { esp: 'brevo', apiKey: 'test-key' } as Config,
	viewer: { esp: 'emailserviceviewerlocal', apiToken: 'test-token', webhook: '', baseUrl: 'http://localhost:4001' } as Config,
}

export const ESP_NAMES = ['postmark', 'resend', 'brevo', 'viewer'] as const
export type EspName = typeof ESP_NAMES[number]

/**
 * Envoie un payload par le chemin public réel (`getEmailService().sendEmail()`)
 * et retourne le body reçu par `fetch`.
 */
export async function sendAndCapture(esp: EspName, payload: EmailPayload | EmailPayload[]) {
	const { calls } = captureFetch()
	const service = getEmailService(CONFIGS[esp])
	const response = await service.sendEmail(payload)
	return { body: calls[0]?.body, calls, response }
}

/** Payload valide minimal — les tests n'en surchargent que ce qui les concerne. */
export function basePayload(overrides: Partial<EmailPayload> = {}): EmailPayload {
	return {
		from: { name: 'Agence', email: 'agence@exemple.fr' },
		to: [{ email: 'client@exemple.fr' }],
		subject: 'Sujet',
		text: 'Texte',
		html: '<p>Texte</p>',
		metaData: {},
		...overrides,
	}
}

/**
 * Où chaque ESP loge l'adresse de réponse, et sous quelle forme on la lit.
 * Postmark et Resend attendent une chaîne, Brevo un objet, le viewer une chaîne.
 */
export const replyToOf: Record<EspName, (body: any) => string> = {
	postmark: (b) => b.ReplyTo,
	resend: (b) => b.reply_to,
	brevo: (b) => b.replyTo?.name ? `${b.replyTo.name} <${b.replyTo.email}>` : b.replyTo?.email,
	viewer: (b) => b.replyTo,
}

/** Où chaque ESP loge l'adresse d'expédition, lue sous forme de chaîne. */
export const fromOf: Record<EspName, (body: any) => string> = {
	postmark: (b) => b.From,
	resend: (b) => b.from,
	brevo: (b) => b.sender?.name ? `${b.sender.name} <${b.sender.email}>` : b.sender?.email,
	viewer: (b) => b.from,
}

/** Les en-têtes personnalisés, ramenés à un objet clé/valeur commun. */
export const headersOf: Record<EspName, (body: any) => Record<string, string>> = {
	postmark: (b) => Object.fromEntries((b.Headers ?? []).map((h: any) => [h.Name, h.Value])),
	resend: (b) => b.headers ?? {},
	brevo: (b) => b.headers ?? {},
	viewer: (b) => Object.fromEntries((b.headers ?? []).map((h: any) => [h.name, h.value])),
}
