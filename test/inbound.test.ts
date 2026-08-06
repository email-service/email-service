import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getInboundEmail } from '../src/models/emailServiceSelector.js'
import type { InboundMessage } from '../src/types/inbound.type.js'

afterEach(() => vi.unstubAllGlobals())

const FIXTURES = join(import.meta.dirname, 'fixtures', 'inbound')
const fixture = (name: string) => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'))
const rawFixture = (name: string) => readFileSync(join(FIXTURES, name), 'utf8')

/** User-Agents réels des ESP (prefix matching côté librairie). */
const UA = {
	postmark: 'Postmark HTTPClient 1.2.3',
	brevo: 'SendinBlue Webhook/2.0',
	resend: 'Svix-Webhooks/1.84.0',
	viewer: 'email-service-viewer',
}

/** Résultat réussi, ou échec du test avec le détail de l'erreur. */
function messagesOf(result: any): InboundMessage[] {
	if (!result.success) throw new Error('inbound failed: ' + JSON.stringify(result.error))
	return result.data
}

/**
 * Tests d'acceptation du CDC `cdc-reception-inbound.md` §8.
 * Tout se joue sur fixtures : aucun ESP, aucun DNS, aucun réseau.
 */

describe('1. Postmark et Resend produisent le MÊME message normalisé', () => {
	it('aux identifiants près', async () => {
		const postmark = messagesOf(await getInboundEmail(UA.postmark, fixture('postmark-reply.json')))[0]

		// Resend : webhook → API message → message brut.
		stubResendFetch()
		const resend = messagesOf(await getInboundEmail(
			UA.resend,
			fixture('resend-received.json'),
			{ esp: 'resend', apiKey: 'test-key' } as any,
		))[0]

		const comparable = (m: InboundMessage) => ({
			messageId: m.messageId,
			inReplyTo: m.inReplyTo,
			references: m.references,
			from: m.from,
			to: m.to,
			subject: m.subject,
			text: m.text,
		})

		expect(comparable(resend)).toEqual(comparable(postmark))
	})
})

describe('2. inReplyTo et references remontés pour CHAQUE ESP', () => {
	it('postmark — depuis les en-têtes du payload', async () => {
		const [m] = messagesOf(await getInboundEmail(UA.postmark, fixture('postmark-reply.json')))
		expect(m.inReplyTo).toBe('<campaign-ev42@agence.exemple.com>')
		expect(m.references).toEqual([
			'<campaign-ev41@agence.exemple.com>',
			'<campaign-ev42@agence.exemple.com>',
		])
	})

	it('brevo — en-tête References répété, livré en tableau par l\'ESP', async () => {
		const [m] = messagesOf(await getInboundEmail(UA.brevo, fixture('brevo-batch.json')))
		expect(m.inReplyTo).toBe('<campaign-ev42@agence.exemple.com>')
		expect(m.references).toEqual([
			'<campaign-ev41@agence.exemple.com>',
			'<campaign-ev42@agence.exemple.com>',
		])
	})

	it('resend — ABSENTS de l\'API, récupérés par repli sur le message brut', async () => {
		const calls = stubResendFetch()
		const [m] = messagesOf(await getInboundEmail(
			UA.resend, fixture('resend-received.json'), { esp: 'resend', apiKey: 'k' } as any,
		))

		expect(m.inReplyTo).toBe('<campaign-ev42@agence.exemple.com>')
		// References court sur deux lignes dans le brut : le dépliage RFC 5322
		// §2.2.3 doit avoir eu lieu, sinon la moitié du fil est perdue.
		expect(m.references).toEqual([
			'<campaign-ev41@agence.exemple.com>',
			'<campaign-ev42@agence.exemple.com>',
		])
		// Le brut est bien demandé en requête partielle.
		expect(calls[1].headers.Range).toBe('bytes=0-65535')
	})

	it('postmark — un message sans In-Reply-To garde ses References', async () => {
		const [m] = messagesOf(await getInboundEmail(UA.postmark, fixture('postmark-bounce-notification.json')))
		expect(m.inReplyTo).toBeUndefined()
		expect(m.references).toEqual(['<campaign-ev42@agence.exemple.com>'])
	})
})

describe('3. receivedFor — clé de routage quand inReplyTo est absent', () => {
	it('postmark : OriginalRecipient, partie « plus » comprise', async () => {
		const [m] = messagesOf(await getInboundEmail(UA.postmark, fixture('postmark-attachment-and-autoreply.json')))
		expect(m.receivedFor).toEqual(['conseiller+ev42@agence.exemple.com'])
	})

	it('resend : tableau, tel que l\'ESP le fournit', async () => {
		stubResendFetch()
		const [m] = messagesOf(await getInboundEmail(
			UA.resend, fixture('resend-received.json'), { esp: 'resend', apiKey: 'k' } as any,
		))
		expect(m.receivedFor).toEqual(['conseiller@agence.exemple.com'])
	})

	it('brevo : message spontané sans inReplyTo → routage par Delivered-To', async () => {
		const messages = messagesOf(await getInboundEmail(UA.brevo, fixture('brevo-batch.json')))
		const spontane = messages[1]
		expect(spontane.inReplyTo).toBeUndefined()
		expect(spontane.receivedFor).toEqual(['conseiller@agence.exemple.com'])
	})
})

describe('4. Pièces jointes — métadonnées oui, téléchargement non', () => {
	it('postmark inclut le contenu en base64 (seul ESP dans ce cas)', async () => {
		const [m] = messagesOf(await getInboundEmail(UA.postmark, fixture('postmark-attachment-and-autoreply.json')))
		expect(m.attachments).toEqual([
			{ name: 'carte-visite.png', contentType: 'image/png', contentLength: 24, content: 'iVBORw0KGgoAAAANSUhEUg==' },
		])
	})

	it('brevo remonte le DownloadToken sans le consommer', async () => {
		const messages = messagesOf(await getInboundEmail(UA.brevo, fixture('brevo-batch.json')))
		expect(messages[1].attachments[0]).toEqual({
			name: 'plan.pdf', contentType: 'application/pdf', contentLength: 18432,
			espAttachmentId: 'dl-token-abcdef123456',
		})
	})

	it('resend remonte l\'identifiant, et n\'appelle JAMAIS l\'API pièces jointes', async () => {
		const calls = stubResendFetch()
		const [m] = messagesOf(await getInboundEmail(
			UA.resend, fixture('resend-received.json'), { esp: 'resend', apiKey: 'k' } as any,
		))

		expect(m.attachments[0].espAttachmentId).toBe('2a0c9ce0-3112-4728-976e-47ddcd16a318')
		expect(m.attachments[0].content).toBeUndefined()
		// Deux appels seulement : message puis brut. Aucun sur /attachments.
		expect(calls).toHaveLength(2)
		expect(calls.some(c => c.url.includes('attachment'))).toBe(false)
	})
})

describe('5. Config absente sur un ESP en deux temps → erreur explicite', () => {
	it('resend sans clé API : refus, pas de message tronqué', async () => {
		const result = await getInboundEmail(UA.resend, fixture('resend-received.json'))
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error.name).toBe('CONFIG_REQUIRED_FOR_INBOUND')
	})
})

describe('6. Brevo groupe plusieurs messages dans un webhook', () => {
	it('items[] → autant de messages normalisés', async () => {
		const messages = messagesOf(await getInboundEmail(UA.brevo, fixture('brevo-batch.json')))
		expect(messages).toHaveLength(2)
		expect(messages.map(m => m.subject)).toEqual(['Re: Votre projet d\'achat', 'Demande de renseignements'])
	})
})

describe('7. Viewer — même code qu\'en production', () => {
	it('le message simulé est normalisé comme un vrai', async () => {
		const [m] = messagesOf(await getInboundEmail(UA.viewer, fixture('viewer-reply.json')))
		expect(m.inReplyTo).toBe('<campaign-ev42@agence.exemple.com>')
		expect(m.from).toEqual({ name: 'Jean Client', email: 'jean.client@exemple.fr' })
		expect(m.receivedFor).toEqual(['conseiller@agence.exemple.com'])
	})
})

describe('8. Invariants et cas d\'erreur', () => {
	it('messageId est TOUJOURS renseigné — c\'est la clé de déduplication', async () => {
		const fixtures: [string, string][] = [
			[UA.postmark, 'postmark-reply.json'],
			[UA.postmark, 'postmark-bounce-notification.json'],
			[UA.brevo, 'brevo-batch.json'],
			[UA.viewer, 'viewer-reply.json'],
		]
		for (const [ua, file] of fixtures) {
			for (const m of messagesOf(await getInboundEmail(ua, fixture(file)))) {
				expect(m.messageId, `${file}`).toBeTruthy()
			}
		}
	})

	it('un webhook rejoué produit le même messageId', async () => {
		const [a] = messagesOf(await getInboundEmail(UA.postmark, fixture('postmark-reply.json')))
		const [b] = messagesOf(await getInboundEmail(UA.postmark, fixture('postmark-reply.json')))
		expect(a.messageId).toBe(b.messageId)
	})

	it('les en-têtes sont normalisés en minuscules', async () => {
		const [m] = messagesOf(await getInboundEmail(UA.postmark, fixture('postmark-reply.json')))
		expect(m.headers['in-reply-to']).toBeTruthy()
		expect(m.headers['In-Reply-To']).toBeUndefined()
	})

	it('un en-tête répété est joint par « , »', async () => {
		// La fixture Postmark porte deux entrées References distinctes.
		const [m] = messagesOf(await getInboundEmail(UA.postmark, fixture('postmark-attachment-and-autoreply.json')))
		expect(m.headers['references']).toBe('<campaign-ev41@agence.exemple.com>, <campaign-ev42@agence.exemple.com>')
	})

	it('User-Agent inconnu → INVALID_ESP', async () => {
		const result = await getInboundEmail('Mozilla/5.0', {})
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error.name).toBe('INVALID_ESP')
	})

	it('payload d\'événement envoyé à la réception → refus explicite', async () => {
		// Le User-Agent ne distingue pas les deux natures : c'est l'endpoint qui
		// le fait. Si le consommateur se trompe de route, il doit le savoir.
		const result = await getInboundEmail(UA.postmark, { RecordType: 'Delivery', MessageID: undefined })
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error.name).toBe('NOT_AN_INBOUND_PAYLOAD')
	})

	it('nodemailer → non supporté (la relève IMAP est hors périmètre)', async () => {
		const result = await getInboundEmail('nodemailer', {})
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error.name).toBe('INBOUND_NOT_SUPPORTED')
	})
})

/** Simule les deux appels réseau de Resend : API message, puis message brut. */
function stubResendFetch() {
	const calls: { url: string, headers: Record<string, string> }[] = []
	vi.stubGlobal('fetch', vi.fn(async (url: any, opts: any) => {
		calls.push({ url: String(url), headers: opts?.headers ?? {} })

		if (String(url).includes('/emails/receiving/')) {
			return { ok: true, status: 200, json: async () => fixture('resend-api-message.json') } as any
		}
		return { ok: true, status: 206, text: async () => rawFixture('resend-raw-headers.eml') } as any
	}))
	return calls
}
