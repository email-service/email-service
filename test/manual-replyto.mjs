// Test manuel replyTo + en-têtes — exécuter après `npm run build`
// node test/manual-replyto.mjs
//
// Envoie RÉELLEMENT vers le viewer local (aucun e-mail ne part) : c'est le
// pendant manuel des tests Vitest, qui eux n'atteignent jamais le réseau.
// Vérifier ensuite dans le dashboard (http://localhost:4000/dashboard) que le
// Reply-To affiché est bien celui du conseiller et que les en-têtes sont listés.
//
// Prérequis : viewer lancé (back :4001) — cf. scripts/email-service-start.sh

import { getEmailService } from '../dist/esm/index.js'

const VIEWER_URL = process.env.EMAIL_VIEWER_URL || 'http://localhost:4001'
const TOKEN = process.env.EMAIL_VIEWER_TOKEN || 'dev'

function check(label, cond, detail = '') {
	console.log(`${cond ? 'OK  ' : 'FAIL'} | ${label}${detail ? ' — ' + detail : ''}`)
}

const service = getEmailService({
	esp: 'emailserviceviewerlocal',
	apiToken: TOKEN,
	webhook: '',
	baseUrl: VIEWER_URL,
	logger: true,
})

const base = {
	from: 'Agence Expat Immo <agence@exemple.fr>',
	to: 'client@exemple.fr',
	subject: 'Essai replyTo v0.6.2',
	text: 'Répondez à ce message : la réponse doit partir au conseiller.',
	html: '<p>Répondez à ce message : la réponse doit partir au conseiller.</p>',
	metaData: { essai: 'replyTo' },
}

// Cas 1 — replyTo distinct de from, avec un Reply-To parasite dans les en-têtes.
// Attendu dans le dashboard : Reply-To = conseiller, AUCUN en-tête Reply-To.
{
	const result = await service.sendEmail({
		...base,
		subject: 'Essai 1 — replyTo + en-tête parasite',
		replyTo: 'Jean Conseiller <jean@exemple.fr>',
		headers: [
			{ name: 'Reply-To', value: 'intrus@exemple.fr' },
			{ name: 'X-Campagne', value: 'ete-2026' },
			{ name: 'List-Unsubscribe', value: '<https://exemple.fr/desinscription/jeton>' },
		],
	})
	check('envoi 1 accepté par le viewer', result.success === true, JSON.stringify(result.error ?? ''))
	console.log('     → dashboard : Reply-To doit être « Jean Conseiller <jean@exemple.fr> »')
	console.log('     → dashboard : en-têtes X-Campagne et List-Unsubscribe visibles, AUCUN Reply-To')
}

// Cas 2 — sans replyTo : l'adresse de réponse retombe sur l'expéditeur.
{
	const result = await service.sendEmail({
		...base,
		subject: 'Essai 2 — sans replyTo (comportement historique)',
	})
	check('envoi 2 accepté par le viewer', result.success === true, JSON.stringify(result.error ?? ''))
	console.log('     → dashboard : Reply-To doit être identique au From (agence)')
}

// Cas 3 — from en chaîne nue : le From ne doit PAS valoir "undefined".
{
	const result = await service.sendEmail({
		...base,
		from: 'agence@exemple.fr',
		subject: 'Essai 3 — from en chaîne nue',
	})
	check('envoi 3 accepté par le viewer', result.success === true, JSON.stringify(result.error ?? ''))
	console.log('     → dashboard : From = agence@exemple.fr (et non « undefined »)')
}

console.log('\nOuvrir http://localhost:4000/dashboard pour vérifier les trois messages.')
