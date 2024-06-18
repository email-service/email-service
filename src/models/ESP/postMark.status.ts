import { ESPStandardizedWebHook, WebHookStatus } from "../../types/email.type"

export const webHookStatus: { [key: string]: ESPStandardizedWebHook } = {
	Delivery: { webHookType: 'DELIVERED', message: 'Message delivred' },
	Bounce: { webHookType: 'SOFT_BOUNCE', message: 'Message bounced' },
	SpamComplaint: { webHookType: 'SPAM_COMPLAINT', message: 'Message marked as spam' },
	Open: { webHookType: 'OPENED', message: 'Message opened' },
	Click: { webHookType: 'CLICKED', message: 'Link clicked' },
	SubscriptionChange: { webHookType: 'SUBSCRIPTION_CHANGE', message: 'Subscription changed' },
}

export const bouncesTypes : {[key:number]: {type:string, code:number, name:string, webHookEventType: WebHookStatus}} = {
	1 :{ type:"HardBounce",               code : 1,        name : "Hard bounce",                      webHookEventType : "HARD_BOUNCE" },  // The server was unable to deliver your message (ex: unknown user, mailbox not found).
	2 :{ type:"Transient",                code : 2,        name : "Message delayed/Undeliverable",    webHookEventType : "DELAYED"},  // The server could not temporarily deliver your message (ex: Message is delayed due to network troubles).
	16:{ type:"Unsubscribe",              code : 16,       name : "Unsubscribe request",              webHookEventType : "SUBSCRIPTION_CHANGE"},  // Unsubscribe or Remove request.
	32 :{ type:"Subscribe",               code : 32,       name : "Subscribe request",                webHookEventType : "SUBSCRIPTION_CHANGE" },  // Subscribe request from someone wanting to get added to the mailing list.
	64: { type:"AutoResponder",           code : 64,       name : "Auto responder",                   webHookEventType : "SOFT_BOUNCE"},  // "Autoresponder" is an automatic email responder including nondescript NDRs and some "out of office" replies.
	128 :{ type:"AddressChange",          code : 128,      name : "Address change",                   webHookEventType : "SOFT_BOUNCE"},  // The recipient has requested an address change.
	256:{ type:"DnsError",                code : 256,      name : "DNS error",                        webHookEventType : "SOFT_BOUNCE" },  // A temporary DNS error.
	512:{ type:"SpamNotification",         code : 512,      name : "Spam notification",                 webHookEventType : "SPAM" },  // The message was delivered, but was either blocked by the user, or classified as spam, bulk mail, or had rejected content.
	1024:{ type:"OpenRelayTest",          code : 1024,     name : "Open relay test",                  webHookEventType : "REJECTED" },  // // The NDR is actually a test email message to see if the mail server is an open relay.
	2048:{ type:"Unknown",                code : 2048,     name : "Unknown",                          webHookEventType : "REJECTED"},  // Unable to classify the NDR.
	4096:{ type:"SoftBounce",             code : 4096,     name : "Soft bounce",                      webHookEventType : "SOFT_BOUNCE"},  // Unable to temporarily deliver message (i.e. mailbox full, account disabled, exceeds quota, out of disk space).
	8192:{ type:"VirusNotification",       code : 8192,     name : "Virus notification",                webHookEventType : "SOFT_BOUNCE"},  // The bounce is actually a virus notification warning about a virus/code infected message.
	16384:{ type:"ChallengeVerification",  code : 16384,    name : "Spam challenge verification",       webHookEventType : "SOFT_BOUNCE"},  // The bounce is a challenge asking for verification you actually sent the email. Typcial challenges are made by Spam Arrest, or MailFrontier Matador.
	100000:{ type:"BadEmailAddress",      code : 100000,   name : "Invalid email address",            webHookEventType : "HARD_BOUNCE"},  // The address is not a valid email address.
	100001:{ type:"SpamComplaint",        code : 100001,   name : "Spam complaint",                   webHookEventType : "SPAM_COMPLAINT" },  // The subscriber explicitly marked this message as spam.
	100002:{ type:"ManuallyDeactivated",  code : 100002,   name : "Manually deactivated",             webHookEventType : "SUBSCRIPTION_CHANGE" },  // The email was manually deactivated.
	100003:{ type:"Unconfirmed",           code : 100003,   name : "Registration not confirmed",        webHookEventType : "REJECTED" },  // // The subscriber has not clicked on the confirmation link upon registration or import.
	100006:{ type:"Blocked",              code : 100006,   name : "ISP block",                        webHookEventType : "REJECTED" },  // Blocked from this ISP due to content or blacklisting.
	100007:{ type:"SMTPApiError",         code : 100007,   name : "SMTP API error",                   webHookEventType : "REJECTED"  },  // An error occurred while accepting an email through the SMTP API.
	100008:{ type:"InboundError",         code : 100008,   name : "Processing failed",                webHookEventType : "REJECTED"},  // Unable to deliver inbound message to destination inbound hook.
	100009:{ type:"DMARCPolicy",          code : 100009,   name : "DMARC Policy",                     webHookEventType : "SOFT_BOUNCE"},  // Email rejected due DMARC Policy.
	100010:{ type:"TemplateRenderingFailed", code : 100010,name : "Template rendering failed",        webHookEventType : "REJECTED" },  // An error occurred while attempting to render your template.,    
}