import { ESPStandardizedWebHook } from "../../types/error.type";

export const webHookStatus : { [key: string]: ESPStandardizedWebHook } = {
	Delivery: {status : 'DELIVERY', message: 'Message sent'},
	Bounce:{status : 'BOUNCE', message: 'Message bounced'},
	SpamComplaint:{status : 'SPAM', message: 'Message marked as spam'},
	Open:{status : 'OPEN', message: 'Message opened'},
	Click:{status : 'LINK_CLICK', message: 'Link clicked'}
}