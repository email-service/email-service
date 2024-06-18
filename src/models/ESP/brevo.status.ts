import { ESPStandardizedWebHook } from "../../types/email.type";


export const webHookStatus: { [key: string]: ESPStandardizedWebHook } = {
	request: { webHookType: 'SENDED', message: 'Message requested' },
	delivered: { webHookType: 'DELIVERED', message: 'Message delivred' },
	soft_bounce: { webHookType: 'SOFT_BOUNCE', message: 'Soft bounce' },
	hard_bounce: { webHookType: 'HARD_BOUNCE', message: 'Hard bounce' },
	complaint: { webHookType: 'SPAM_COMPLAINT', message: 'Message marked as spam' },
	click: { webHookType: 'CLICKED', message: 'Link clicked' },
	defered: { webHookType: 'DELAYED', message: 'Link clicked' },
	unique_opened: { webHookType: 'CLICKED', message: 'Message opened' },
	opened : { webHookType: 'OPENED', message: 'Message opened' },
	invalid_email : { webHookType: 'HARD_BOUNCE', message: 'Invalid email' },
	blocked : { webHookType: 'REJECTED', message: 'Blocked' },
	error : { webHookType: 'REJECTED', message: 'Error' },
	unsubscribe : { webHookType: 'SUBSCRIPTION_CHANGE', message: 'Unsubscribed' },
	proxy_open : { webHookType: 'REJECTED', message: 'Proxy opened' },
}

