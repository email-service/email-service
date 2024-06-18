import { ESPStandardizedWebHook } from "../../types/email.type";

export const webHookStatus: { [key: string]: ESPStandardizedWebHook } = {
	'email.delivered': { webHookType: 'DELIVERED', message: 'Message sent' },
	'email.bounced': { webHookType: 'SOFT_BOUNCE', message: 'Message bounced' },
	'email.sent': { webHookType: 'SENDED', message: 'Message sent' },
	'email.opened': { webHookType: 'OPENED', message: 'Message opened' },
	'email.clicked': { webHookType: 'CLICKED', message: 'Link clicked' },
	'email.complained': { webHookType: 'SPAM_COMPLAINT', message: 'Message marked as spam' },
	'email.delivery_delayed': { webHookType: 'DELAYED', message: 'Message delivery delayed' }
}