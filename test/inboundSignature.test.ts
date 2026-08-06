import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { verifyInboundSignature } from '../src/utils/verifyInboundSignature.js'
import { parseRawHeaders, parseReferences } from '../src/utils/parseHeaders.js'

const SECRET = 'whsec_' + Buffer.from('un-secret-de-test').toString('base64')

/** Fabrique les en-têtes Svix d'un corps donné (ce que fait Resend). */
function svixHeaders(body: string, secret = SECRET, id = 'msg_123', timestamp = '1754470000') {
	const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
	const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64')
	return { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` }
}

describe('Test 5 du CDC — signature invalide → refus avant tout traitement', () => {
	const body = JSON.stringify({ type: 'email.received', data: { email_id: 'abc' } })

	it('signature valide → acceptée', () => {
		expect(verifyInboundSignature('resend', svixHeaders(body), body, SECRET).valid).toBe(true)
	})

	it('corps modifié après signature → refusée', () => {
		const headers = svixHeaders(body)
		const falsifie = body.replace('abc', 'xyz')
		expect(verifyInboundSignature('resend', headers, falsifie, SECRET).valid).toBe(false)
	})

	it('mauvais secret → refusée', () => {
		const autre = 'whsec_' + Buffer.from('autre-secret').toString('base64')
		expect(verifyInboundSignature('resend', svixHeaders(body), body, autre).valid).toBe(false)
	})

	it('en-têtes Svix absents → refusée, avec la raison', () => {
		const result = verifyInboundSignature('resend', {}, body, SECRET)
		expect(result.valid).toBe(false)
		expect(result.reason).toBe('MISSING_SVIX_HEADERS')
	})

	it('la casse des en-têtes n\'a pas d\'importance', () => {
		const h = svixHeaders(body)
		const majuscules = { 'Svix-Id': h['svix-id'], 'SVIX-TIMESTAMP': h['svix-timestamp'], 'Svix-Signature': h['svix-signature'] }
		expect(verifyInboundSignature('resend', majuscules, body, SECRET).valid).toBe(true)
	})

	it('plusieurs signatures (rotation de secret) → une seule doit correspondre', () => {
		const h = svixHeaders(body)
		const avecIntrus = { ...h, 'svix-signature': `v1,signature-invalide ${h['svix-signature']}` }
		expect(verifyInboundSignature('resend', avecIntrus, body, SECRET).valid).toBe(true)
	})

	it('secret absent → refusée plutôt qu\'ignorée', () => {
		expect(verifyInboundSignature('resend', svixHeaders(body), body, '').valid).toBe(false)
	})

	it('Postmark et Brevo ne signent pas : « non applicable », jamais « valide »', () => {
		// Laisser croire à une vérification qui n'a pas eu lieu serait pire que
		// de dire qu'elle n'existe pas : ces ESP se protègent par jeton d'URL.
		for (const esp of ['postmark', 'brevo']) {
			const result = verifyInboundSignature(esp, {}, 'body', SECRET)
			expect(result.valid).toBe(false)
			expect(result.reason).toContain('NOT_SUPPORTED')
		}
	})
})

describe('parseRawHeaders — extraction depuis un message MIME brut', () => {
	it('déplie les valeurs courant sur plusieurs lignes (RFC 5322 §2.2.3)', () => {
		const raw = 'References: <a@x>\n\t<b@x>\nSubject: Test\n\nCorps ignoré'
		expect(parseRawHeaders(raw)['references']).toBe('<a@x> <b@x>')
	})

	it('s\'arrête à la première ligne vide — le corps n\'est jamais analysé', () => {
		const raw = 'Subject: Test\n\nTo: pas-un-entete@exemple.fr'
		const headers = parseRawHeaders(raw)
		expect(headers['subject']).toBe('Test')
		expect(headers['to']).toBeUndefined()
	})

	it('normalise les noms en minuscules', () => {
		expect(parseRawHeaders('In-Reply-To: <a@x>\n\n')['in-reply-to']).toBe('<a@x>')
	})

	it('joint les occurrences multiples par « , »', () => {
		expect(parseRawHeaders('Received: un\nReceived: deux\n\n')['received']).toBe('un, deux')
	})

	it('tolère CRLF comme LF', () => {
		expect(parseRawHeaders('Subject: Test\r\n\r\ncorps')['subject']).toBe('Test')
	})

	it('ignore une ligne sans séparateur plutôt que de produire un en-tête bancal', () => {
		const headers = parseRawHeaders('From bidule@x Wed Aug 6\nSubject: Test\n\n')
		expect(headers['subject']).toBe('Test')
		expect(Object.keys(headers)).toHaveLength(1)
	})

	it('entrée vide → objet vide, pas d\'exception', () => {
		expect(parseRawHeaders('')).toEqual({})
	})
})

describe('parseReferences', () => {
	it('découpe sur espaces et virgules', () => {
		expect(parseReferences('<a@x> <b@x>, <c@x>')).toEqual(['<a@x>', '<b@x>', '<c@x>'])
	})

	it('valeur absente → tableau vide', () => {
		expect(parseReferences(undefined)).toEqual([])
	})
})
