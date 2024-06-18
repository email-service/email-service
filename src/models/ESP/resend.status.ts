import { WebHookStatus } from "../../types/email.type";

export const webHookStatus: { [key: string]: WebHookStatus } = {
	'email.delivered': 'DELIVERED',
	'email.bounced': 'SOFT_BOUNCE',
	'email.sent': 'SENDED',
	'email.opened': 'OPENED',
	'email.clicked': 'CLICKED',
	'email.complained': 'SPAM_COMPLAINT',
	'email.delivery_delayed': 'DELAYED'
}