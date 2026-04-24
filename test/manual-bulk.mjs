// Test manuel sendBulk — après `npm run build`
// node test/manual-bulk.mjs
//
// On hérite de ESP pour override doSendMail → aucun appel HTTP réel.
// Permet de vérifier :
// - boucle + hooks
// - validation marketing (unsubscribeUrl obligatoire)
// - règles de blocage stream (transactional vs marketing)
// - interpolation mergeVars
// - injection List-Unsubscribe en marketing
// - auto-generation text depuis html

import { ESP } from '../dist/esm/models/esp.js'

function check(label, cond, detail = '') {
	console.log(`${cond ? 'OK  ' : 'FAIL'} | ${label}${detail ? ' — ' + detail : ''}`)
}

function mkFakeESP(opts, simulate) {
	class FakeESP extends ESP {
		history = []
		async doSendMail(options) {
			this.history.push(options)
			return simulate ? simulate(options) : {
				success: true,
				status: 200,
				data: { to: options.to, submittedAt: new Date().toISOString(), messageId: 'fake-' + Math.random() },
			}
		}
	}
	const cfg = { esp: 'emailserviceviewer', apiToken: 'test', webhook: 'test', logger: false, rateLimit: { perSecond: 10000 } }
	return new FakeESP(cfg, opts)
}

// === 1. Transactional, pas de hooks, 3 destinataires ===
{
	const esp = mkFakeESP({})
	const report = await esp.sendBulk({
		stream: 'transactional',
		campaignId: 'c-1',
		from: 'sender@x.com',
		recipients: [
			{ email: 'a@x.com' },
			{ email: 'b@x.com' },
			{ email: 'c@x.com' },
		],
		template: { subject: 'Hi', html: '<p>Hello</p>' },
	})
	check('1a. 3 sent', report.sent === 3)
	check('1b. 0 skipped', report.skipped.length === 0)
	check('1c. 0 failed', report.failed.length === 0)
	check('1d. campaignId propagé', esp.history[0].metaData.campaignId === 'c-1')
	check('1e. stream dans metaData', esp.history[0].metaData.stream === 'transactional')
	check('1f. text auto-généré', esp.history[0].text === 'Hello', esp.history[0].text)
	check('1g. pas de List-Unsubscribe', !esp.history[0].headers?.some((h) => h.name === 'List-Unsubscribe'))
}

// === 2. Marketing sans unsubscribeUrl → throw ===
{
	const esp = mkFakeESP({})
	let threw = false
	try {
		await esp.sendBulk({
			stream: 'marketing',
			campaignId: 'c-2',
			from: 'sender@x.com',
			recipients: [{ email: 'a@x.com' }],
			template: { subject: 'Promo', html: '<p>Deal</p>' },
			// unsubscribeUrl absent → doit throw
		})
	} catch (err) {
		threw = err.message.includes('unsubscribeUrl')
	}
	check('2. marketing sans unsubscribeUrl throw', threw)
}

// === 3. Marketing avec unsubscribeUrl → injecte List-Unsubscribe ===
{
	const esp = mkFakeESP({})
	const report = await esp.sendBulk({
		stream: 'marketing',
		campaignId: 'c-3',
		from: 'sender@x.com',
		recipients: [{ email: 'a@x.com' }],
		template: { subject: 'Promo', html: '<p>Deal</p>' },
		unsubscribeUrl: (email) => `https://app.example/unsub?email=${encodeURIComponent(email)}`,
	})
	check('3a. 1 sent', report.sent === 1)
	const h = esp.history[0].headers ?? []
	const listUnsub = h.find((x) => x.name === 'List-Unsubscribe')
	check('3b. List-Unsubscribe présent', !!listUnsub, listUnsub?.value)
	check('3c. URL par destinataire', listUnsub?.value.includes('a%40x.com'), listUnsub?.value)
	check('3d. List-Unsubscribe-Post présent', h.some((x) => x.name === 'List-Unsubscribe-Post'))
}

// === 4. checkSuppression bloque selon stream ===
{
	// Hook qui retourne unsubscribe_marketing pour b@x.com
	const hook = async (email) => email === 'b@x.com' ? 'unsubscribe_marketing' : null

	// 4a. Transactional : unsubscribe_marketing ne bloque PAS
	{
		const esp = mkFakeESP({ hooks: { checkSuppression: hook } })
		const report = await esp.sendBulk({
			stream: 'transactional',
			campaignId: 'c-4a',
			from: 'sender@x.com',
			recipients: [{ email: 'a@x.com' }, { email: 'b@x.com' }, { email: 'c@x.com' }],
			template: { subject: 'Hi', html: '<p>x</p>' },
		})
		check('4a. transactional : unsubscribe_marketing passe', report.sent === 3 && report.skipped.length === 0)
	}

	// 4b. Marketing : unsubscribe_marketing BLOQUE
	{
		const esp = mkFakeESP({ hooks: { checkSuppression: hook } })
		const report = await esp.sendBulk({
			stream: 'marketing',
			campaignId: 'c-4b',
			from: 'sender@x.com',
			recipients: [{ email: 'a@x.com' }, { email: 'b@x.com' }, { email: 'c@x.com' }],
			template: { subject: 'Hi', html: '<p>x</p>' },
			unsubscribeUrl: (e) => `https://u/${e}`,
		})
		check('4b. marketing : unsubscribe_marketing bloque', report.sent === 2 && report.skipped.length === 1)
		check('  skipped email correct', report.skipped[0]?.email === 'b@x.com')
		check('  skipped reason correct', report.skipped[0]?.reason === 'unsubscribe_marketing')
	}

	// 4c. hard_bounce bloque dans les 2 streams
	{
		const esp = mkFakeESP({ hooks: { checkSuppression: async () => 'hard_bounce' } })
		const report = await esp.sendBulk({
			stream: 'transactional',
			campaignId: 'c-4c',
			from: 'sender@x.com',
			recipients: [{ email: 'a@x.com' }],
			template: { subject: 'Hi', html: '<p>x</p>' },
		})
		check('4c. hard_bounce bloque en transactional', report.sent === 0 && report.skipped.length === 1)
	}
}

// === 5. Hooks onSent / onFailed appelés ===
{
	let sentCount = 0, failedCount = 0, skippedCount = 0
	const hooks = {
		onSent: async () => { sentCount++ },
		onFailed: async () => { failedCount++ },
		onSkipped: async () => { skippedCount++ },
		checkSuppression: async (email) => email === 's@x.com' ? 'hard_bounce' : null,
	}
	const simulate = (options) => {
		const toEmail = typeof options.to === 'string' ? options.to : options.to?.[0]?.email ?? options.to
		if (toEmail === 'f@x.com') {
			return { success: false, status: 400, error: { name: 'REJECTED', message: 'bad' } }
		}
		return { success: true, status: 200, data: { to: options.to, submittedAt: '', messageId: 'm' } }
	}
	const esp = mkFakeESP({ hooks }, simulate)
	const report = await esp.sendBulk({
		stream: 'transactional',
		campaignId: 'c-5',
		from: 'sender@x.com',
		recipients: [
			{ email: 'ok@x.com' },
			{ email: 'f@x.com' },  // failed
			{ email: 's@x.com' },  // skipped (hard_bounce)
			{ email: 'ok2@x.com' },
		],
		template: { subject: 'Hi', html: '<p>x</p>' },
	})
	check('5a. onSent appelé 2 fois', sentCount === 2, `sent=${sentCount}`)
	check('5b. onFailed appelé 1 fois', failedCount === 1, `failed=${failedCount}`)
	check('5c. onSkipped appelé 1 fois', skippedCount === 1, `skipped=${skippedCount}`)
	check('5d. report.sent = 2', report.sent === 2)
	check('5e. report.failed.length = 1', report.failed.length === 1)
	check('5f. report.skipped.length = 1', report.skipped.length === 1)
}

// === 6. mergeVars interpolés ===
{
	const esp = mkFakeESP({})
	await esp.sendBulk({
		stream: 'transactional',
		campaignId: 'c-6',
		from: 'sender@x.com',
		recipients: [
			{ email: 'alice@x.com', mergeVars: { user: { firstName: 'Alice' } } },
			{ email: 'bob@x.com', mergeVars: { user: { firstName: 'Bob' } } },
		],
		template: { subject: 'Hello {{user.firstName}}', html: '<p>Hi {{user.firstName}}!</p>' },
	})
	check('6a. subject interpolé Alice', esp.history[0].subject === 'Hello Alice', esp.history[0].subject)
	check('6b. html interpolé Alice', esp.history[0].html === '<p>Hi Alice!</p>')
	check('6c. subject interpolé Bob', esp.history[1].subject === 'Hello Bob')
	check('6d. text stripped', esp.history[0].text === 'Hi Alice!', esp.history[0].text)
}

// === 7. Report structure ===
{
	const esp = mkFakeESP({})
	const report = await esp.sendBulk({
		stream: 'transactional',
		campaignId: 'c-7',
		from: 'sender@x.com',
		recipients: [{ email: 'a@x.com' }],
		template: { subject: 'X', html: '<p>X</p>' },
	})
	check('7a. campaignId dans report', report.campaignId === 'c-7')
	check('7b. startedAt/endedAt présents', !!report.startedAt && !!report.endedAt)
	check('7c. durationMs >= 0', typeof report.durationMs === 'number' && report.durationMs >= 0)
}

console.log('\nTests sendBulk terminés.')
