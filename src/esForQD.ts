import type { WebHookResponse, WebHookStatus } from "./types/email.type"
import { ESPStandardizedError, StandardError } from "./types/error.type"
import { getWebHook as getWebHookStandard } from "./models/emailServiceSelector"

type WebHookResponseDataForQD = {
	webHookType: WebHookStatus
	to: string,
	from?: string,
	subject?: string,
	metaData?: object,
	dump?: string,
	espMessageId: string
	espRecordType: string,
	espType?: string,
}

type WebHookResponseForQD = {
	success: true,
	status: number,
	data: WebHookResponseDataForQD,
	espData?: any
}
	|
{
	success: false,
	status: number,
	error: StandardError | ESPStandardizedError
}

async function getWebHook(userAgent: string, req: any, logger: boolean = false): Promise<WebHookResponseForQD> {

	const data: WebHookResponse = await getWebHookStandard(userAgent, req, logger)

	const dataForQD: WebHookResponseForQD = data.success ? {
		success: data.success,
		status: data.status,
		data: {
			webHookType: data.data.webHookType,
			to: data.data.to,
			from: data.data.from,
			subject: data.data.subject,
			metaData: data.data.metaData,
			dump: data.data.dump,
			espMessageId: data.data.messageId,
			espRecordType: data.espData.espRecordType,
			espType: data.espData.espType
		},
		espData: data.espData
	} : { success: false, status: data.status, error: data.error }

	return dataForQD
}


// src/index.ts

import { getEmailService, EmailServiceSelector } from "./models/emailServiceSelector.js";
import type { EmailPayload, StandardResponse } from "./types/email.type.js";

export { getEmailService, getWebHook, EmailServiceSelector }
export type { EmailPayload, StandardResponse }
