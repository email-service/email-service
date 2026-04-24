// Test manuel renderTemplate — exécuter après `npm run build`
// node test/manual-template.mjs

import { renderTemplate } from '../dist/esm/index.js'

function check(label, actual, expected) {
	const ok = actual === expected
	console.log(`${ok ? 'OK  ' : 'FAIL'} | ${label}`)
	if (!ok) {
		console.log(`     expected: ${JSON.stringify(expected)}`)
		console.log(`     actual  : ${JSON.stringify(actual)}`)
	}
}

// Simple var
check(
	'simple var',
	renderTemplate('Bonjour {{name}}', { name: 'Romain' }),
	'Bonjour Romain',
)

// Dotted path
check(
	'dotted path',
	renderTemplate('Facture {{invoice.number}} pour {{user.firstName}}', {
		user: { firstName: 'Alice' },
		invoice: { number: 'INV-042' },
	}),
	'Facture INV-042 pour Alice',
)

// Var absente → string vide
check(
	'var absente',
	renderTemplate('Hello {{missing}}!', {}),
	'Hello !',
)

// Objet imbriqué manquant → string vide
check(
	'nested manquant',
	renderTemplate('x={{a.b.c}}', { a: null }),
	'x=',
)

// Échappement HTML par défaut
check(
	'escape HTML',
	renderTemplate('<p>{{comment}}</p>', { comment: '<script>alert(1)</script>' }),
	'<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
)

// Triple-accolade = raw
check(
	'raw triple accolade',
	renderTemplate('<div>{{{html}}}</div>', { html: '<b>bold</b>' }),
	'<div><b>bold</b></div>',
)

// Nombre / booléen
check(
	'number + boolean',
	renderTemplate('count={{n}} active={{active}}', { n: 42, active: true }),
	'count=42 active=true',
)

// Null / undefined explicites
check(
	'null undefined',
	renderTemplate('x=[{{a}}] y=[{{b}}]', { a: null, b: undefined }),
	'x=[] y=[]',
)

// Espace interne autorisé dans les accolades
check(
	'espaces dans accolades',
	renderTemplate('{{ name }} / {{  user.firstName  }}', {
		name: 'X',
		user: { firstName: 'Y' },
	}),
	'X / Y',
)
