import { describe, it, expect, afterEach, vi } from 'vitest'
import { ESP_NAMES, basePayload, sendAndCapture, captureFetch, CONFIGS, type EspName } from './helpers/captureFetch.js'
import { getEmailService } from '../src/models/emailServiceSelector.js'

afterEach(() => vi.unstubAllGlobals())

/**
 * Pièces jointes d'un e-mail sortant : chaque adaptateur traduit
 * `{ filename, content (base64), contentType }` dans la forme de son API.
 * On éprouve le body construit, sans réseau.
 */

const PDF = { filename: 'avis-echeance.pdf', content: Buffer.from('%PDF-1.4 test').toString('base64'), contentType: 'application/pdf' }

/** Où chaque ESP loge les pièces jointes, et sous quelle forme. */
const attachmentsOf: Record<EspName, (body: any) => unknown> = {
	postmark: (body) => body.Attachments,
	resend: (body) => body.attachments,
	brevo: (body) => body.attachment,
	viewer: (body) => body.attachments,
}
const expected: Record<EspName, unknown> = {
	postmark: [{ Name: PDF.filename, Content: PDF.content, ContentType: PDF.contentType }],
	resend: [{ filename: PDF.filename, content: PDF.content, content_type: PDF.contentType }],
	brevo: [{ name: PDF.filename, content: PDF.content }],
	viewer: [PDF],
}

describe('1. sans pièce jointe → le champ n\'est pas transmis (non-régression)', () => {
	for (const esp of ESP_NAMES) {
		it(`${esp}`, async () => {
			const { body } = await sendAndCapture(esp, basePayload())
			expect(attachmentsOf[esp](body)).toBeUndefined()
			const empty = await sendAndCapture(esp, basePayload({ attachments: [] }))
			expect(attachmentsOf[esp](empty.body)).toBeUndefined()
		})
	}
})

describe('2. pièce jointe → transmise dans la forme de l\'ESP, contenu intact', () => {
	for (const esp of ESP_NAMES) {
		it(`${esp}`, async () => {
			const { body, response } = await sendAndCapture(esp, basePayload({ attachments: [PDF] }))
			expect(attachmentsOf[esp](body)).toEqual(expected[esp])
			expect((response as any).success).toBe(true)
		})
	}

	it('plusieurs pièces jointes gardent leur ordre', async () => {
		const second = { filename: 'quittance.pdf', content: Buffer.from('%PDF-1.4 autre').toString('base64'), contentType: 'application/pdf' }
		const { body } = await sendAndCapture('postmark', basePayload({ attachments: [PDF, second] }))
		expect(body.Attachments.map((file: any) => file.Name)).toEqual(['avis-echeance.pdf', 'quittance.pdf'])
	})

	it('postmark — sendMailMultiple (lot natif) porte aussi les pièces jointes', async () => {
		const { calls } = captureFetch()
		const service = getEmailService(CONFIGS.postmark)
		await service.sendEmail([
			basePayload({ attachments: [PDF], to: [{ email: 'a@exemple.fr' }] }),
			basePayload({ to: [{ email: 'b@exemple.fr' }] }),
		])
		expect(calls[0].url).toContain('/email/batch')
		expect(calls[0].body[0].Attachments).toEqual(expected.postmark)
		expect(calls[0].body[1].Attachments).toBeUndefined()
	})
})
