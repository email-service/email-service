// Test manuel normalizeSuppressionFromWebhook — après `npm run build`
// node test/manual-suppression-normalizer.mjs

import { normalizeSuppressionFromWebhook } from '../dist/esm/index.js'

function check(label, actual, expected) {
	const ok = JSON.stringify(actual) === JSON.stringify(expected)
	console.log(`${ok ? 'OK  ' : 'FAIL'} | ${label}`)
	if (!ok) {
		console.log(`     expected: ${JSON.stringify(expected)}`)
		console.log(`     actual  : ${JSON.stringify(actual)}`)
	}
}

function wh(type, extra = {}) {
	return {
		success: true,
		status: 200,
		data: {
			webHookType: type,
			message: 'ok',
			messageId: 'mid-1',
			to: 'bounce@test.com',
			...extra,
		},
	}
}

// HARD_BOUNCE
check(
	'HARD_BOUNCE → hard_bounce',
	normalizeSuppressionFromWebhook(wh('HARD_BOUNCE')),
	{ email: 'bounce@test.com', reason: 'hard_bounce' },
)

// SPAM_COMPLAINT
check(
	'SPAM_COMPLAINT → spam_complaint',
	normalizeSuppressionFromWebhook(wh('SPAM_COMPLAINT')),
	{ email: 'bounce@test.com', reason: 'spam_complaint' },
)

// SPAM (alias)
check(
	'SPAM → spam_complaint',
	normalizeSuppressionFromWebhook(wh('SPAM')),
	{ email: 'bounce@test.com', reason: 'spam_complaint' },
)

// SUBSCRIPTION_CHANGE sans metaData → unsubscribe_marketing (default conservateur)
check(
	'SUBSCRIPTION_CHANGE sans stream → unsubscribe_marketing',
	normalizeSuppressionFromWebhook(wh('SUBSCRIPTION_CHANGE')),
	{ email: 'bounce@test.com', reason: 'unsubscribe_marketing' },
)

// SUBSCRIPTION_CHANGE avec stream marketing
check(
	'SUBSCRIPTION_CHANGE stream=marketing → unsubscribe_marketing',
	normalizeSuppressionFromWebhook(wh('SUBSCRIPTION_CHANGE', { metaData: { stream: 'marketing' } })),
	{ email: 'bounce@test.com', reason: 'unsubscribe_marketing' },
)

// SUBSCRIPTION_CHANGE avec stream transactional → unsubscribe_all
check(
	'SUBSCRIPTION_CHANGE stream=transactional → unsubscribe_all',
	normalizeSuppressionFromWebhook(wh('SUBSCRIPTION_CHANGE', { metaData: { stream: 'transactional' } })),
	{ email: 'bounce@test.com', reason: 'unsubscribe_all' },
)

// Events neutres → null
check(
	'DELIVERED → null',
	normalizeSuppressionFromWebhook(wh('DELIVERED')),
	null,
)
check(
	'OPENED → null',
	normalizeSuppressionFromWebhook(wh('OPENED')),
	null,
)
check(
	'SOFT_BOUNCE → null',
	normalizeSuppressionFromWebhook(wh('SOFT_BOUNCE')),
	null,
)
check(
	'REJECTED → null',
	normalizeSuppressionFromWebhook(wh('REJECTED')),
	null,
)

// Response en erreur → null
check(
	'response.success=false → null',
	normalizeSuppressionFromWebhook({
		success: false,
		status: 400,
		error: { name: 'PARSE_ERROR', message: 'bad payload' },
	}),
	null,
)

// email manquant → null
check(
	'email manquant → null',
	normalizeSuppressionFromWebhook({
		success: true,
		status: 200,
		data: { webHookType: 'HARD_BOUNCE', message: 'ok', messageId: 'x', to: '' },
	}),
	null,
)
