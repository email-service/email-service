import { ESPStandardizedWebHook } from "../../types/error.type";

export const webHookStatus : { [key: string]: ESPStandardizedWebHook } = {
	DELIVERY: {status : 'DELIVERY', message: 'Message sent'},
	BOUNCE:{status : 'BOUNCE', message: 'Message bounced'},
	SPAM:{status : 'SPAM', message: 'Message marked as spam'},
	OPEN:{status : 'OPEN', message: 'Message opened'},
	LINK:{status : 'LINK_CLICK', message: 'Link clicked'}
}