import { describe, it, expect } from 'vitest'
import { getWebHook } from '../src/models/emailServiceSelector.js'

/**
 * Statuts émis par le viewer local — les onze du contrat `WebHookStatus`, plus
 * les alias historiques.
 *
 * Ce fichier existe à cause d'un défaut resté invisible longtemps : le viewer
 * émettait `LINK_CLICK` pour un clic, la table n'en connaissait que `LINK`, et
 * l'événement était rejeté en `NO_STATUS_FOR_WEBHOOK`. Rien ne le signalait.
 */

const UA = 'email-service-viewer'

/** Payload d'événement tel que le viewer le poste. */
const event = (type: string) => ({
	success: true,
	status: 200,
	data: {
		type,
		category: 'SUCCESS',
		id: 'msg-1',
		messageId: 'msg-1',
		to: 'client@exemple.fr',
		from: 'agence@exemple.fr',
		subject: 'Sujet',
		metaData: { projet: 'p42' },
		submittedAt: '2026-08-06T10:00:00.000Z',
	},
})

describe('Les onze statuts sont acceptés', () => {
	const canoniques = [
		'SENDED', 'DELAYED', 'DELIVERED', 'OPENED', 'CLICKED',
		'SPAM_COMPLAINT', 'SPAM', 'SOFT_BOUNCE', 'HARD_BOUNCE',
		'SUBSCRIPTION_CHANGE', 'REJECTED',
	]

	for (const type of canoniques) {
		it(type, async () => {
			const result = await getWebHook(UA, event(type))
			expect(result.success, `${type} refusé`).toBe(true)
			if (result.success) expect(result.data.webHookType).toBe(type)
		})
	}
})

describe('Alias historiques — les viewers déjà déployés continuent de fonctionner', () => {
	const alias: [string, string][] = [
		['DELIVERY', 'DELIVERED'],
		['OPEN', 'OPENED'],
		['LINK', 'CLICKED'],
		['BOUNCE', 'SOFT_BOUNCE'],
		// Émis par le viewer depuis toujours, absent de la table jusqu'ici :
		// c'est LE défaut que ce fichier verrouille.
		['LINK_CLICK', 'CLICKED'],
	]

	for (const [emis, attendu] of alias) {
		it(`${emis} → ${attendu}`, async () => {
			const result = await getWebHook(UA, event(emis))
			expect(result.success, `${emis} refusé`).toBe(true)
			if (result.success) expect(result.data.webHookType).toBe(attendu)
		})
	}
})

describe('Rapprochement de l\'événement et de l\'envoi', () => {
	it('messageId est celui de l\'envoi — sans lui l\'événement ne désigne rien', async () => {
		const result = await getWebHook(UA, event('DELIVERED'))
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.messageId).toBe('msg-1')
			expect(result.data.metaData).toEqual({ projet: 'p42' })
		}
	})

	it('un type inconnu est refusé explicitement', async () => {
		const result = await getWebHook(UA, event('N_IMPORTE_QUOI'))
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error.name).toBe('NO_STATUS_FOR_WEBHOOK')
	})
})
