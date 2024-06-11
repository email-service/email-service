
import { ESPStandardizedWebHook } from "../../types/error.type";

export const webHookStatus: { [key: string]: ESPStandardizedWebHook } = {
	request: { webHookType: 'INBOUND', message: 'Message requested' },
	delivered: { webHookType: 'DELIVERY', message: 'Message delivred' },
	soft_bounce: { webHookType: 'BOUNCE', message: 'Soft bounce' },
	hard_bounce: { webHookType: 'BOUNCE', message: 'Hard bounce' },
	complaint: { webHookType: 'SPAM', message: 'Message marked as spam' },
	click: { webHookType: 'LINK_CLICK', message: 'Link clicked' },
	defered: { webHookType: 'DEFERED', message: 'Link clicked' },
	unique_opened: { webHookType: 'OPEN', message: 'Message opened' },
	opened : { webHookType: 'OPEN', message: 'Message opened' },
	invalid_email : { webHookType: 'BOUNCE', message: 'Invalid email' },
	blocked : { webHookType: 'REJECT', message: 'Blocked' },
	error : { webHookType: 'REJECT', message: 'Error' },
	unsubscribe : { webHookType: 'UNSUBSCRIBE', message: 'Unsubscribed' },
	proxy_open : { webHookType: 'OPEN', message: 'Proxy opened' },
}

