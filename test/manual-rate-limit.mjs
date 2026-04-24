// Test manuel TokenBucket + rateLimit intégré — après `npm run build`
// node test/manual-rate-limit.mjs
//
// Deux tests :
// 1. TokenBucket isolé : 5 acquires à 2/s → la 3e+ doit attendre
// 2. CompositeBucket : perSecond + perMinute → respect du plus restrictif
//
// Pas de vrai appel ESP : on teste l'algorithme directement.

import { TokenBucket, CompositeBucket, createRateLimiter, RATE_LIMIT_DEFAULTS } from '../dist/esm/utils/rateLimit.js'

function check(label, cond, detail = '') {
	console.log(`${cond ? 'OK  ' : 'FAIL'} | ${label}${detail ? ' — ' + detail : ''}`)
}

// === 1. TokenBucket simple : 2 tokens/s, capacity 2 ===
{
	const bucket = new TokenBucket(2, 2)
	const start = Date.now()
	const waits = []
	for (let i = 0; i < 5; i++) {
		waits.push(await bucket.acquire())
	}
	const elapsed = Date.now() - start
	// Les 2 premiers passent immédiat (capacité = 2)
	// Les 3 suivants attendent ~500ms chacun (rate=2/s, 1 token = 500ms)
	// Total attendu : ~1500ms
	check('TokenBucket 2/s : 2 premiers immédiats', waits[0] === 0 && waits[1] === 0)
	check('TokenBucket 2/s : 3e+ attend', waits[2] > 400 && waits[2] < 700, `wait=${waits[2]}ms`)
	check('TokenBucket 2/s : total ~1.5s', elapsed >= 1200 && elapsed < 2500, `elapsed=${elapsed}ms`)
}

// === 2. Defaults exposés ===
{
	check('DEFAULTS resend=10/s', RATE_LIMIT_DEFAULTS.resend.perSecond === 10)
	check('DEFAULTS brevo=100/s', RATE_LIMIT_DEFAULTS.brevo.perSecond === 100)
	check('DEFAULTS viewer=1000/s', RATE_LIMIT_DEFAULTS.emailserviceviewer.perSecond === 1000)
}

// === 3. createRateLimiter : override prend le dessus sur default ===
{
	const limiter = createRateLimiter('resend', { perSecond: 1 })
	check('createRateLimiter override', limiter instanceof TokenBucket)
	const start = Date.now()
	await limiter.acquire()  // immédiat
	await limiter.acquire()  // attend ~1s
	const elapsed = Date.now() - start
	check('override 1/s : 2e acquire ~1s', elapsed >= 800 && elapsed < 1500, `elapsed=${elapsed}ms`)
}

// === 4. createRateLimiter : sans override → prend default ESP ===
{
	const limiter = createRateLimiter('postmark')
	check('default postmark : bucket créé', limiter !== null)
	// postmark default = 10/s, donc acquires rapides en série
	const start = Date.now()
	for (let i = 0; i < 5; i++) await limiter.acquire()
	const elapsed = Date.now() - start
	check('postmark 10/s : 5 acquires rapides', elapsed < 500, `elapsed=${elapsed}ms`)
}

// === 5. CompositeBucket : perSecond + perMinute ===
{
	// perSecond=10 + perMinute=12 → la minute limite à 12, plus restrictif
	// après 12 envois dans 1.2s, le perMinute force à attendre ~5s
	const limiter = createRateLimiter('resend', { perSecond: 10, perMinute: 12 })
	check('CompositeBucket créé', limiter instanceof CompositeBucket)
}

console.log('\nTous tests rate limit terminés.')
