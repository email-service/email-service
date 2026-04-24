// Test manuel injectUnsubscribeHeader — exécuter après `npm run build`
// node test/manual-unsubscribe.mjs

import { injectUnsubscribeHeader } from '../dist/esm/index.js'

function check(label, cond, detail = '') {
	console.log(`${cond ? 'OK  ' : 'FAIL'} | ${label}${detail ? ' — ' + detail : ''}`)
}

const basePayload = {
	from: 'sender@x.com',
	to: 'recipient@y.com',
	subject: 'Hello',
	text: 'Hi',
	html: '<p>Hi</p>',
	metaData: {},
}

// Cas 1 : payload sans headers → ajoute 2 entrées
{
	const result = injectUnsubscribeHeader(basePayload, 'https://app.example/unsub?t=abc')
	const listUnsub = result.headers?.find((h) => h.name === 'List-Unsubscribe')
	const listUnsubPost = result.headers?.find((h) => h.name === 'List-Unsubscribe-Post')
	check('ajout headers (sans mailto)', !!listUnsub && !!listUnsubPost)
	check(
		'  List-Unsubscribe = <url>',
		listUnsub?.value === '<https://app.example/unsub?t=abc>',
		listUnsub?.value,
	)
	check(
		'  List-Unsubscribe-Post = One-Click',
		listUnsubPost?.value === 'List-Unsubscribe=One-Click',
		listUnsubPost?.value,
	)
}

// Cas 2 : avec mailto
{
	const result = injectUnsubscribeHeader(
		basePayload,
		'https://app.example/unsub?t=abc',
		'unsubscribe@example.com',
	)
	const listUnsub = result.headers?.find((h) => h.name === 'List-Unsubscribe')
	check(
		'avec mailto',
		listUnsub?.value === '<mailto:unsubscribe@example.com>, <https://app.example/unsub?t=abc>',
		listUnsub?.value,
	)
}

// Cas 3 : immutabilité (le payload source n'est pas muté)
{
	const src = { ...basePayload, headers: [{ name: 'X-Custom', value: 'keep' }] }
	const result = injectUnsubscribeHeader(src, 'https://app.example/unsub')
	check('src !== result', src !== result)
	check('src.headers length préservé', src.headers.length === 1)
	check(
		'result garde header existant',
		result.headers?.some((h) => h.name === 'X-Custom' && h.value === 'keep'),
	)
	check('result a 3 headers au total', result.headers?.length === 3)
}

// Cas 4 : remplace un header List-Unsubscribe pré-existant
{
	const src = {
		...basePayload,
		headers: [
			{ name: 'List-Unsubscribe', value: '<https://old.example/>' },
			{ name: 'X-Other', value: 'keep' },
		],
	}
	const result = injectUnsubscribeHeader(src, 'https://new.example/unsub')
	const listUnsubs = result.headers?.filter((h) => h.name === 'List-Unsubscribe') ?? []
	check('une seule entrée List-Unsubscribe', listUnsubs.length === 1)
	check(
		'  pointe sur la nouvelle URL',
		listUnsubs[0]?.value === '<https://new.example/unsub>',
		listUnsubs[0]?.value,
	)
	check(
		'  header X-Other préservé',
		result.headers?.some((h) => h.name === 'X-Other'),
	)
}
