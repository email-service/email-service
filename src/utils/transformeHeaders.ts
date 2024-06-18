import { HeadersPayLoad } from "../types/email.type";

export function transformHeaders(headers: HeadersPayLoad): Record<string, string> {
	return headers.reduce((acc, header) => {
		acc[header.name] = header.value;
		return acc;
	}, {} as Record<string, string>);
}
