
import type { EmailPayload, StandardResponse } from '../types/email.type.js'
import type { BulkPayload, BulkReport, EmailServiceHooks, EmailStream, SuppressionReason } from '../types/bulk.type.js'
import { renderTemplate } from './templating.js'
import { injectUnsubscribeHeader } from './unsubscribe.js'
import { stripHtml } from './stripHtml.js'

/**
 * Règles de blocage par stream. Appelées sur la `SuppressionReason` retournée
 * par le hook `checkSuppression` du consommateur. Si la fonction retourne `true`,
 * l'envoi est skip et `onSkipped` est invoqué.
 *
 * - `transactional` bloque uniquement sur les cas absolus (adresse invalide,
 *   désinscription totale)
 * - `marketing` bloque en plus sur les cas « soft » (plainte spam, désinscription
 *   canal marketing)
 */
function blocksStream(reason: SuppressionReason, stream: EmailStream): boolean {
	if (reason === 'hard_bounce' || reason === 'unsubscribe_all') return true
	if (stream === 'marketing') {
		return reason === 'spam_complaint' || reason === 'unsubscribe_marketing'
	}
	return false
}

/**
 * Boucle interne exécutée par `ESP.sendBulk`. Reçoit une fonction `sendOne`
 * qui délègue à `sendMail()` de l'ESP concret — permet au template method de
 * la classe ESP de conserver le rate limit Phase 3 automatiquement.
 *
 * Comportement par destinataire :
 * 1. Validation marketing → si absent, throw avant même la boucle
 * 2. checkSuppression via hook → skip si bloqué par le stream
 * 3. Interpolation subject/html/text via renderTemplate + mergeVars
 * 4. Injection List-Unsubscribe si marketing
 * 5. Appel sendOne (qui applique rate limit)
 * 6. Hook onSent / onFailed
 * 7. Accumulation dans le BulkReport
 */
export async function runBulk(
	payload: BulkPayload,
	hooks: EmailServiceHooks | undefined,
	sendOne: (payload: EmailPayload) => Promise<StandardResponse>,
): Promise<BulkReport> {
	// Validation stream=marketing
	if (payload.stream === 'marketing' && typeof payload.unsubscribeUrl !== 'function') {
		throw new Error(
			'[sendBulk] stream="marketing" requires unsubscribeUrl: (email) => string',
		)
	}

	const startedAt = new Date().toISOString()
	const startTs = Date.now()
	const report: BulkReport = {
		campaignId: payload.campaignId,
		sent: 0,
		skipped: [],
		failed: [],
		startedAt,
		endedAt: startedAt,
		durationMs: 0,
	}

	for (const recipient of payload.recipients) {
		// 1. checkSuppression
		if (hooks?.checkSuppression) {
			try {
				const reason = await hooks.checkSuppression(recipient.email, {
					stream: payload.stream,
					campaignId: payload.campaignId,
				})
				if (reason && blocksStream(reason, payload.stream)) {
					report.skipped.push({ email: recipient.email, reason })
					if (hooks.onSkipped) {
						try {
							await hooks.onSkipped(recipient.email, reason, payload.campaignId)
						} catch { /* swallow — ne casse pas le batch */ }
					}
					continue
				}
			} catch {
				// Hook user cassé → on continue l'envoi sans check, plutôt que
				// d'échouer tout le batch. Décision conservatrice : mieux vaut
				// envoyer à quelqu'un en suppression que planter une campagne.
			}
		}

		// 2. Interpolation mergeVars dans subject/html/text
		const vars = recipient.mergeVars ?? {}
		const subject = renderTemplate(payload.template.subject, vars)
		const html = renderTemplate(payload.template.html, vars)
		const text = payload.template.text
			? renderTemplate(payload.template.text, vars)
			: stripHtml(html)

		// 3. Construction payload unitaire
		let emailPayload: EmailPayload = {
			from: payload.from,
			to: recipient.name
				? [{ email: recipient.email, name: recipient.name }]
				: recipient.email,
			subject,
			html,
			text,
			metaData: {
				...(payload.metadata ?? {}),
				campaignId: payload.campaignId,
				stream: payload.stream,
			},
		}

		// 4. Injection List-Unsubscribe en marketing
		if (payload.stream === 'marketing') {
			const url = payload.unsubscribeUrl(recipient.email)
			emailPayload = injectUnsubscribeHeader(emailPayload, url)
		}

		// 5. Envoi via sendOne (qui applique le rate limit de l'ESP)
		let response: StandardResponse
		try {
			response = await sendOne(emailPayload)
		} catch (err) {
			const error = {
				name: 'SEND_THROWN',
				message: err instanceof Error ? err.message : String(err),
			}
			report.failed.push({ email: recipient.email, error })
			if (hooks?.onFailed) {
				try {
					await hooks.onFailed(recipient.email, error, payload.campaignId)
				} catch { /* swallow */ }
			}
			continue
		}

		// 6. Hooks post-envoi — narrowing manuel via const pour contourner
		// l'inférence TS qui ne narrow pas toujours un `let` réassigné.
		const result: StandardResponse = response
		if (result.success === true) {
			report.sent += 1
			if (hooks?.onSent) {
				try {
					await hooks.onSent(recipient.email, result, payload.campaignId)
				} catch { /* swallow */ }
			}
		} else {
			report.failed.push({ email: recipient.email, error: result.error })
			if (hooks?.onFailed) {
				try {
					await hooks.onFailed(recipient.email, result.error, payload.campaignId)
				} catch { /* swallow */ }
			}
		}
	}

	const endedAt = new Date().toISOString()
	report.endedAt = endedAt
	report.durationMs = Date.now() - startTs
	return report
}
