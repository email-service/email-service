import { ESPStandardizedWebHook } from "../../types/error.type";

export const webHookStatus : { [key: string]: ESPStandardizedWebHook } = {
	DELIVERY: {webHookType : 'DELIVERY', message: 'Message sent'},
	BOUNCE:{webHookType : 'BOUNCE', message: 'Message bounced'},
	SPAM:{webHookType : 'SPAM', message: 'Message marked as spam'},
	OPEN:{webHookType : 'OPEN', message: 'Message opened'},
	LINK:{webHookType : 'LINK_CLICK', message: 'Link clicked'}
}