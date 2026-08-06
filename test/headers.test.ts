import { describe, it, expect, afterEach, vi } from 'vitest'
import { ESP_NAMES, basePayload, sendAndCapture, headersOf, fromOf } from './helpers/captureFetch.js'
import { stripHeaders, toPostmarkHeaders, toRecordHeaders } from '../src/utils/headers.js'
import { injectUnsubscribeHeader } from '../src/utils/unsubscribe.js'

afterEach(() => vi.unstubAllGlobals())

/**
 * Test 5 du CDC, étendu : les en-têtes personnalisés doivent traverser TOUS les
 * adaptateurs, et au format que chaque ESP attend réellement.
 */

describe('5. Les en-têtes personnalisés atteignent chaque ESP', () => {
	for (const esp of ESP_NAMES) {
		it(`${esp}`, async () => {
			const { body } = await sendAndCapture(esp, basePayload({
				headers: [
					{ name: 'List-Unsubscribe', value: '<https://exemple.fr/desinscription/jeton>' },
					{ name: 'X-Campagne', value: 'ete-2026' },
				],
			}))

			const headers = headersOf[esp](body)
			expect(headers['List-Unsubscribe']).toBe('<https://exemple.fr/desinscription/jeton>')
			expect(headers['X-Campagne']).toBe('ete-2026')
		})
	}

	it('postmark reçoit le format Pascal [{Name, Value}] exigé par son API', async () => {
		const { body } = await sendAndCapture('postmark', basePayload({
			headers: [{ name: 'X-Campagne', value: 'ete-2026' }],
		}))
		expect(body.Headers).toEqual([{ Name: 'X-Campagne', Value: 'ete-2026' }])
	})

	it('brevo reçoit un objet clé/valeur, et X-Mailin-custom ne l\'écrase pas', async () => {
		const { body } = await sendAndCapture('brevo', basePayload({
			metaData: { projet: 'p-1' },
			headers: [{ name: 'X-Campagne', value: 'ete-2026' }],
		}))
		expect(body.headers['X-Campagne']).toBe('ete-2026')
		expect(body.headers['X-Mailin-custom']).toBe(JSON.stringify({ projet: 'p-1' }))
	})
})

describe('6. from en chaîne nue → From correct (non-régression)', () => {
	for (const esp of ESP_NAMES) {
		it(`${esp}`, async () => {
			const { body } = await sendAndCapture(esp, basePayload({ from: 'agence@exemple.fr' }))
			expect(fromOf[esp](body)).toBe('agence@exemple.fr')
			// Le défaut historique : un cast produisait la chaîne "undefined".
			expect(String(fromOf[esp](body))).not.toContain('undefined')
		})
	}
})

describe('utilitaires d\'en-têtes', () => {
	it('stripHeaders retire quelle que soit la casse et préserve le reste', () => {
		const result = stripHeaders(
			[{ name: 'REPLY-TO', value: 'a' }, { name: 'X-Gardé', value: 'b' }],
			['Reply-To'],
		)
		expect(result).toEqual([{ name: 'X-Gardé', value: 'b' }])
	})

	it('stripHeaders tolère l\'absence d\'en-têtes', () => {
		expect(stripHeaders(undefined, ['Reply-To'])).toEqual([])
	})

	it('toPostmarkHeaders retourne undefined plutôt qu\'un tableau vide', () => {
		// Postmark n'a pas à recevoir une clé Headers vide.
		expect(toPostmarkHeaders([])).toBeUndefined()
		expect(toPostmarkHeaders(undefined)).toBeUndefined()
	})

	it('toRecordHeaders produit un objet clé/valeur', () => {
		expect(toRecordHeaders([{ name: 'A', value: '1' }, { name: 'B', value: '2' }])).toEqual({ A: '1', B: '2' })
	})

	it('injectUnsubscribeHeader remplace un en-tête existant quelle que soit sa casse', () => {
		const payload = basePayload({ headers: [{ name: 'list-unsubscribe', value: '<https://ancien>' }] })
		const result = injectUnsubscribeHeader(payload, 'https://nouveau')

		const names = result.headers!.map(h => h.name.toLowerCase())
		// Une seule occurrence, malgré la casse différente de l'entrée.
		expect(names.filter(n => n === 'list-unsubscribe')).toHaveLength(1)
		expect(result.headers!.find(h => h.name === 'List-Unsubscribe')!.value).toBe('<https://nouveau>')
	})
})
