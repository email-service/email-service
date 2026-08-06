import { describe, it, expect, afterEach, vi } from 'vitest'
import { basePayload, sendAndCapture } from './helpers/captureFetch.js'
import { getWebHook } from '../src/models/emailServiceSelector.js'

afterEach(() => vi.unstubAllGlobals())

/**
 * `metaData` chez Resend — point relevé dans `_TODO.md` (« Passage des metaData
 * pour resend en utilisant les tags »).
 *
 * Vérifié sur la documentation Resend le 2026-08-06 : les webhooks renvoient
 * `data.tags` mais PAS les en-têtes personnalisés. Les tags sont donc le seul
 * canal par lequel une information de l'appelant peut revenir.
 */

describe('metaData → tags Resend', () => {
	it('chaque entrée scalaire devient un tag, à côté du tag technique', async () => {
		const { body } = await sendAndCapture('resend', basePayload({
			tag: 'campagne',
			metaData: { projet: 'p42', evenement: 'ev7' },
		}))

		expect(body.tags).toEqual([
			{ name: 'tag', value: 'campagne' },
			{ name: 'projet', value: 'p42' },
			{ name: 'evenement', value: 'ev7' },
		])
	})

	it('les caractères refusés par Resend sont remplacés (sinon l\'envoi échoue en 400)', async () => {
		const { body } = await sendAndCapture('resend', basePayload({
			metaData: { contact: 'jean@exemple.fr' },
		}))

		const contact = body.tags.find((t: any) => t.name === 'contact')
		expect(contact.value).toBe('jean-exemple-fr')
	})

	it('les valeurs non scalaires sont écartées plutôt qu\'aplaties', async () => {
		const { body } = await sendAndCapture('resend', basePayload({
			metaData: { projet: 'p42', detail: { a: 1 }, vide: null },
		}))

		expect(body.tags.map((t: any) => t.name)).toEqual(['tag', 'projet'])
	})

	it('sans metaData, seul le tag technique est envoyé (non-régression)', async () => {
		const { body } = await sendAndCapture('resend', basePayload())
		expect(body.tags).toEqual([{ name: 'tag', value: 'DefaultTag' }])
	})

	it('le webhook restitue metaData depuis data.tags, sans le tag technique', async () => {
		// L'ESP est reconnu par son User-Agent : Resend passe par Svix.
		const result = await getWebHook('Svix-Webhooks/1.84.0', {
			type: 'email.delivered',
			data: {
				email_id: 'id-1',
				to: ['client@exemple.fr'],
				subject: 'Sujet',
				from: 'agence@exemple.fr',
				tags: { tag: 'campagne', projet: 'p42' },
			},
		} as any)

		expect(result.success).toBe(true)
		if (result.success) expect(result.data.metaData).toEqual({ projet: 'p42' })
	})
})
