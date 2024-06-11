import { ESPStandardizedWebHook } from "../../types/error.type";

export const webHookStatus: { [key: string]: ESPStandardizedWebHook } = {
	Delivery: { webHookType: 'DELIVERY', message: 'Message sent' },
	Bounce: { webHookType: 'BOUNCE', message: 'Message bounced' },
	SpamComplaint: { webHookType: 'SPAM', message: 'Message marked as spam' },
	Open: { webHookType: 'OPEN', message: 'Message opened' },
	Click: { webHookType: 'LINK_CLICK', message: 'Link clicked' }
}