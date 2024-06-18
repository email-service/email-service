import {  WebHookStatus } from "../../types/email.type"

export const webHookStatus: { [key: string]: WebHookStatus } = {
	Delivery: 'DELIVERED',
	Bounce: 'SOFT_BOUNCE',
	SpamComplaint:'SPAM_COMPLAINT',
	Open:  'OPENED',
	Click:'CLICKED',
	SubscriptionChange:  'SUBSCRIPTION_CHANGE'
}

export const bouncesTypes : {[key:number]: {type:string,  webHookEventType: WebHookStatus}} = {
	1 :{ type:"HardBounce",                  webHookEventType : "HARD_BOUNCE" },  // The server was unable to deliver your message (ex: unknown user, mailbox not found).
	2 :{ type:"Transient",                   webHookEventType : "DELAYED"},  // The server could not temporarily deliver your message (ex: Message is delayed due to network troubles).
	16:{ type:"Unsubscribe",                 webHookEventType : "SUBSCRIPTION_CHANGE"},  // Unsubscribe or Remove request.
	32 :{ type:"Subscribe",                  webHookEventType : "SUBSCRIPTION_CHANGE" },  // Subscribe request from someone wanting to get added to the mailing list.
	64: { type:"AutoResponder",              webHookEventType : "SOFT_BOUNCE"},  // "Autoresponder" is an automatic email responder including nondescript NDRs and some "out of office" replies.
	128 :{ type:"AddressChange",             webHookEventType : "SOFT_BOUNCE"},  // The recipient has requested an address change.
	256:{ type:"DnsError",                   webHookEventType : "SOFT_BOUNCE" },  // A temporary DNS error.
	512:{ type:"SpamNotification",            webHookEventType : "SPAM" },  // The message was delivered, but was either blocked by the user, or classified as spam, bulk mail, or had rejected content.
	1024:{ type:"OpenRelayTest",             webHookEventType : "REJECTED" },  // // The NDR is actually a test email message to see if the mail server is an open relay.
	2048:{ type:"Unknown",                   webHookEventType : "REJECTED"},  // Unable to classify the NDR.
	4096:{ type:"SoftBounce",                webHookEventType : "SOFT_BOUNCE"},  // Unable to temporarily deliver message (i.e. mailbox full, account disabled, exceeds quota, out of disk space).
	8192:{ type:"VirusNotification",          webHookEventType : "SOFT_BOUNCE"},  // The bounce is actually a virus notification warning about a virus/code infected message.
	16384:{ type:"ChallengeVerification",     webHookEventType : "SOFT_BOUNCE"},  // The bounce is a challenge asking for verification you actually sent the email. Typcial challenges are made by Spam Arrest, or MailFrontier Matador.
	100000:{ type:"BadEmailAddress",         webHookEventType : "HARD_BOUNCE"},  // The address is not a valid email address.
	100001:{ type:"SpamComplaint",           webHookEventType : "SPAM_COMPLAINT" },  // The subscriber explicitly marked this message as spam.
	100002:{ type:"ManuallyDeactivated",     webHookEventType : "SUBSCRIPTION_CHANGE" },  // The email was manually deactivated.
	100003:{ type:"Unconfirmed",              webHookEventType : "REJECTED" },  // // The subscriber has not clicked on the confirmation link upon registration or import.
	100006:{ type:"Blocked",                 webHookEventType : "REJECTED" },  // Blocked from this ISP due to content or blacklisting.
	100007:{ type:"SMTPApiError",            webHookEventType : "REJECTED"  },  // An error occurred while accepting an email through the SMTP API.
	100008:{ type:"InboundError",            webHookEventType : "REJECTED"},  // Unable to deliver inbound message to destination inbound hook.
	100009:{ type:"DMARCPolicy",             webHookEventType : "SOFT_BOUNCE"},  // Email rejected due DMARC Policy.
	100010:{ type:"TemplateRenderingFailed", webHookEventType : "REJECTED" },  // An error occurred while attempting to render your template.,    
}