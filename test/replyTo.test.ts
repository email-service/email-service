import { describe, it, expect, afterEach, vi } from 'vitest'
import { ESP_NAMES, basePayload, sendAndCapture, replyToOf, fromOf, headersOf, captureFetch, CONFIGS } from './helpers/captureFetch.js'
import { getEmailService } from '../src/models/emailServiceSelector.js'

afterEach(() => vi.unstubAllGlobals())

/**
 * Tests d'acceptation du CDC — ajout du 6 août 2026 (v0.6.2).
 * Réf. email-service-documentation/cahierDesChargesQD.md
 */

describe('1. replyTo absent → adresse d\'expédition (non-régression)', () => {
	for (const esp of ESP_NAMES) {
		it(`${esp}`, async () => {
			const { body } = await sendAndCapture(esp, basePayload())
			expect(replyToOf[esp](body)).toBe('Agence <agence@exemple.fr>')
			expect(fromOf[esp](body)).toBe('Agence <agence@exemple.fr>')
		})
	}
})

describe('2. replyTo renseigné → cette adresse est transmise', () => {
	for (const esp of ESP_NAMES) {
		it(`${esp}`, async () => {
			const { body } = await sendAndCapture(esp, basePayload({ replyTo: 'conseiller@exemple.fr' }))
			expect(replyToOf[esp](body)).toBe('conseiller@exemple.fr')
			// L'expéditeur ne bouge pas : c'est tout l'intérêt du champ.
			expect(fromOf[esp](body)).toBe('Agence <agence@exemple.fr>')
		})
	}

	it('postmark — sendMailMultiple (lot natif) porte aussi replyTo', async () => {
		const { calls } = captureFetch()
		const service = getEmailService(CONFIGS.postmark)
		await service.sendEmail([
			basePayload({ replyTo: 'conseiller@exemple.fr', to: [{ email: 'a@exemple.fr' }] }),
			basePayload({ replyTo: 'autre@exemple.fr', to: [{ email: 'b@exemple.fr' }] }),
		])

		expect(calls[0].url).toContain('/email/batch')
		expect(calls[0].body[0].ReplyTo).toBe('conseiller@exemple.fr')
		expect(calls[0].body[1].ReplyTo).toBe('autre@exemple.fr')
	})
})

describe('3. Reply-To dans headers → une seule valeur, celle du champ', () => {
	for (const esp of ESP_NAMES) {
		it(`${esp}`, async () => {
			const { body } = await sendAndCapture(esp, basePayload({
				replyTo: 'conseiller@exemple.fr',
				headers: [{ name: 'Reply-To', value: 'intrus@exemple.fr' }],
			}))

			expect(replyToOf[esp](body)).toBe('conseiller@exemple.fr')
			// L'en-tête personnalisé a disparu : l'ESP n'a jamais deux sources.
			expect(headersOf[esp](body)['Reply-To']).toBeUndefined()
		})
	}

	it('le filtrage est insensible à la casse (RFC 5322 §2.2)', async () => {
		const { body } = await sendAndCapture('resend', basePayload({
			replyTo: 'conseiller@exemple.fr',
			headers: [{ name: 'reply-to', value: 'intrus@exemple.fr' }, { name: 'X-Autre', value: 'gardé' }],
		}))

		expect(body.headers['reply-to']).toBeUndefined()
		expect(body.reply_to).toBe('conseiller@exemple.fr')
		// Les autres en-têtes ne sont pas emportés au passage.
		expect(body.headers['X-Autre']).toBe('gardé')
	})

	it('sans champ replyTo, un Reply-To posé à la main est ignoré (rupture assumée v0.6.2)', async () => {
		const { body } = await sendAndCapture('resend', basePayload({
			headers: [{ name: 'Reply-To', value: 'contournement@exemple.fr' }],
		}))

		expect(body.headers['Reply-To']).toBeUndefined()
		expect(body.reply_to).toBe('Agence <agence@exemple.fr>')
	})
})

describe('4. replyTo au format "Nom <adresse>"', () => {
	for (const esp of ESP_NAMES) {
		it(`${esp}`, async () => {
			const { body } = await sendAndCapture(esp, basePayload({ replyTo: 'Jean Conseiller <jean@exemple.fr>' }))
			expect(replyToOf[esp](body)).toBe('Jean Conseiller <jean@exemple.fr>')
		})
	}

	it('brevo reçoit bien un objet {email, name}, pas une chaîne', async () => {
		const { body } = await sendAndCapture('brevo', basePayload({ replyTo: 'Jean Conseiller <jean@exemple.fr>' }))
		expect(body.replyTo).toEqual({ name: 'Jean Conseiller', email: 'jean@exemple.fr' })
		expect(body.sender).toEqual({ name: 'Agence', email: 'agence@exemple.fr' })
	})
})
