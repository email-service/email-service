import { WebHookStatus } from "../../types/email.type";

export const webHookStatus: { [key: string]: WebHookStatus } = {
	DELIVERY: 'DELIVERED',
	BOUNCE: 'SOFT_BOUNCE',
	SPAM: 'SPAM',
	OPEN: 'OPENED',
	LINK: 'CLICKED'
}