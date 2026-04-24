export type ESPName = 'postmark' | 'brevo' | 'nodemailer' | 'emailserviceviewer' | 'emailserviceviewerlocal' | 'resend';

/** @deprecated use ESPName — conservé pour rétrocompatibilité interne. */
type ESP = ESPName;

/**
 * Rate limit ESP. Optionnel : si absent, la lib applique un défaut prudent
 * par ESP (voir RATE_LIMIT_DEFAULTS). Fournir une valeur remplace
 * complètement le défaut, pas de merge partiel.
 *
 * - perSecond et perMinute peuvent être combinés : le rate limiter attendra
 *   sur la plus restrictive des deux contraintes.
 */
export type RateLimitConfig = {
	perSecond?: number
	perMinute?: number
}

type ConfigBase = {
	logger?: boolean
	rateLimit?: RateLimitConfig
}

export type ConfigPostmark = ConfigBase & {
	esp: 'postmark',
	stream: string,
	apiKey: string,
}

export type ConfigBrevo = ConfigBase & {
	esp: 'brevo',
	apiKey: string,
}

export type ConfigNodeMailer = ConfigBase & {
	esp: 'nodemailer',
	host: string,
	port: number,
	secure?: boolean,
	debug?: boolean,
	auth: {
		user: string,
		pass: string
	}
}

export type ConfigEmailServiceViewer = ConfigBase & {
	esp: 'emailserviceviewer' | 'emailserviceviewerlocal',
	apiToken: string,
	webhook: string,
}

export type ConfigResend = ConfigBase & {
	esp: 'resend',
	apiKey: string,
}

export type ConfigMinimal = ConfigBase & {
	esp: ESPName,
}

export type Config = ConfigPostmark | ConfigBrevo | ConfigNodeMailer | ConfigEmailServiceViewer | ConfigResend;
