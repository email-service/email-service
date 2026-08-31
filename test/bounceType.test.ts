import { describe, it, expect } from 'vitest'
import { getWebHook } from '../src/models/emailServiceSelector.js'

/**
 * Nature d'un rebond — Resend n'émet qu'UN événement (`email.bounced`) pour les
 * deux natures : c'est `data.bounce.type` qui tranche.
 *
 * Vérifié sur la documentation officielle le 2026-08-31
 * (resend.com/docs/webhooks/emails/bounced) ET sur des charges utiles réelles
 * de production. Les trois cas `Transient` ci-dessous sont des payloads
 * VRAIMENT reçus (agence Expat'Immo, campagnes des 27-31 août 2026) — c'est ce
 * qui a permis de constater que la librairie classait tout en soft bounce.
 *
 * ⚠️ Piège documenté : la doc écrit `Temporary`, la production envoie
 * `Transient`. Les deux doivent rester acceptées.
 */

const RESEND_UA = 'Svix-Webhooks/1.4.12'

const resendBounce = (bounce: unknown) => ({
	type: 'email.bounced',
	created_at: '2026-08-31T07:12:21.072Z',
	data: {
		email_id: 'afbafa61-f5ed-4c9a-a909-4e0364fa1daf',
		from: "Expat'Immo <contact@expat-immo.com>",
		to: ['liviasersociales@gmail.com'],
		subject: 'Un appartement, deux stratégies',
		bounce,
	},
})

describe('Resend — nature du rebond', () => {
	it('Permanent → HARD_BOUNCE', async () => {
		const result = await getWebHook(RESEND_UA, resendBounce({
			type: 'Permanent',
			subType: 'Suppressed',
			message: 'The recipient is on the suppression list',
			diagnosticCode: ['smtp; 550 5.1.1 user unknown'],
		}))

		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.webHookType).toBe('HARD_BOUNCE')
		expect(result.data.bounce).toEqual({
			kind: 'hard',
			type: 'Permanent',
			subType: 'Suppressed',
			diagnosticCode: 'smtp; 550 5.1.1 user unknown',
			message: 'The recipient is on the suppression list',
		})
	})

	it('Transient/MailboxFull → SOFT_BOUNCE (payload réel : boîte pleine Yahoo)', async () => {
		const result = await getWebHook(RESEND_UA, resendBounce({
			type: 'Transient',
			subType: 'MailboxFull',
			message: "The recipient's email provider sent a bounce message because the recipient's inbox was full.",
			diagnosticCode: ["smtp; 552 5.2.2 This message could not be delivered because the recipient's mailbox is full."],
		}))

		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.webHookType).toBe('SOFT_BOUNCE')
		expect(result.data.bounce?.kind).toBe('soft')
		expect(result.data.bounce?.subType).toBe('MailboxFull')
	})

	it('Transient/General → SOFT_BOUNCE (payload réel : expéditeur bloqué Mimecast)', async () => {
		const result = await getWebHook(RESEND_UA, resendBounce({
			type: 'Transient',
			subType: 'General',
			message: "The recipient's email provider sent a general bounce message.",
			diagnosticCode: ['smtp; 550 Rejected by header based manually Blocked Senders: contact@expat-immo.com'],
		}))

		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.webHookType).toBe('SOFT_BOUNCE')
		expect(result.data.bounce?.diagnosticCode).toContain('Blocked Senders')
	})

	it('Temporary (graphie de la documentation) → SOFT_BOUNCE', async () => {
		const result = await getWebHook(RESEND_UA, resendBounce({ type: 'Temporary', subType: 'General' }))

		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.webHookType).toBe('SOFT_BOUNCE')
		expect(result.data.bounce?.kind).toBe('soft')
	})

	it('type inconnu ou bloc absent → SOFT_BOUNCE (sur un doute, on ne condamne pas l\'adresse)', async () => {
		const unknown = await getWebHook(RESEND_UA, resendBounce({ type: 'Undetermined' }))
		expect(unknown.success && unknown.data.webHookType).toBe('SOFT_BOUNCE')

		const missing = await getWebHook(RESEND_UA, resendBounce(undefined))
		expect(missing.success && missing.data.webHookType).toBe('SOFT_BOUNCE')
		// Aucun bloc à exposer quand l'ESP n'en fournit pas.
		expect(missing.success && missing.data.bounce).toBeUndefined()
	})

	it('la casse du type est indifférente', async () => {
		const result = await getWebHook(RESEND_UA, resendBounce({ type: 'PERMANENT' }))
		expect(result.success && result.data.webHookType).toBe('HARD_BOUNCE')
	})

	it('diagnosticCode : les entrées nulles du tableau sont écartées', async () => {
		const result = await getWebHook(RESEND_UA, resendBounce({
			type: 'Transient',
			subType: 'General',
			diagnosticCode: [null],
		}))

		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.bounce?.diagnosticCode).toBeUndefined()
	})

	it('un événement non-rebond n\'expose aucun bloc bounce', async () => {
		const result = await getWebHook(RESEND_UA, {
			type: 'email.delivered',
			data: { email_id: 'x', to: ['a@b.c'], from: 'z@y.x' },
		})

		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.webHookType).toBe('DELIVERED')
		expect(result.data.bounce).toBeUndefined()
	})
})

describe('Brevo — la nature vient du nom de l\'événement', () => {
	const BREVO_UA = 'SendinBlue'

	it('hard_bounce → HARD_BOUNCE avec bloc normalisé', async () => {
		const result = await getWebHook(BREVO_UA, {
			event: 'hard_bounce',
			'message-id': '<abc@brevo>',
			email: 'a@b.c',
			reason: 'unknown user',
		})

		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.webHookType).toBe('HARD_BOUNCE')
		expect(result.data.bounce?.kind).toBe('hard')
		expect(result.data.bounce?.message).toBe('unknown user')
	})

	it('soft_bounce → SOFT_BOUNCE', async () => {
		const result = await getWebHook(BREVO_UA, {
			event: 'soft_bounce',
			'message-id': '<abc@brevo>',
			email: 'a@b.c',
			reason: 'mailbox full',
		})

		expect(result.success && result.data.bounce?.kind).toBe('soft')
	})
})

describe('Postmark — la nature vient du TypeCode', () => {
	const POSTMARK_UA = 'Postmark'

	it('TypeCode 1 (HardBounce) → HARD_BOUNCE avec bloc normalisé', async () => {
		const result = await getWebHook(POSTMARK_UA, {
			RecordType: 'Bounce',
			TypeCode: 1,
			MessageID: 'pm-1',
			Email: 'a@b.c',
			Description: 'The server was unable to deliver your message',
			Details: 'smtp; 550 5.1.1 unknown user',
		})

		expect(result.success).toBe(true)
		if (!result.success) return
		expect(result.data.webHookType).toBe('HARD_BOUNCE')
		expect(result.data.bounce?.kind).toBe('hard')
		expect(result.data.bounce?.type).toBe('HardBounce')
		expect(result.data.bounce?.diagnosticCode).toBe('smtp; 550 5.1.1 unknown user')
	})

	it('TypeCode 4096 (SoftBounce) → SOFT_BOUNCE', async () => {
		const result = await getWebHook(POSTMARK_UA, {
			RecordType: 'Bounce',
			TypeCode: 4096,
			MessageID: 'pm-2',
			Email: 'a@b.c',
		})

		expect(result.success && result.data.bounce?.kind).toBe('soft')
		expect(result.success && result.data.bounce?.type).toBe('SoftBounce')
	})
})
