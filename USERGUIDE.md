# User Documentation

## Introduction

blabla

## Installation

To use the email-service, ensure you have email-service package installed in your project:

```bash
npm i @email-service/email-service
```

## Usage

Here's an example of how to use the postmark class.

```typescript
const emailServiceConfig = {
	esp : 'postmark',
	stream : 'outbound'
	apiKey: 'MY_POSTMARK_APIKEY',
};

const emailService = new NodeMailerEmailService(emailServiceConfig);

const htmlContent = `
  <h1>MagicLink</h1>
  <p>Here is the MagicLink</p>
  <a href="http://example.com/magic-link">Click here</a>
`;

const emailPayload = {
	from: 'test@example.com',
	to: 'recipient@example.com',
	subject: 'Your subect',
	html: htmlContent
};

const emailResponse = await emailService.sendMail(emailPayload);

if (emailResponse.ok) {
	console.log('Email sent successfully!');
} else {
	console.log('Failed to send email:', emailResponse.error);
}

emailService.close();
```

## Reply-To address (`replyTo`) — since 0.6.2

`replyTo` sets the address recipients answer to, when it must differ from the
sender. Typical case: a campaign sent on behalf of an agency whose replies must
reach the advisor following the client.

```typescript
const emailPayload = {
	from: 'Agency <agency@example.com>',
	to: 'client@example.com',
	replyTo: 'Jane Advisor <jane@example.com>',   // string or { name, email }
	subject: 'Your subject',
	text: '…',
	html: htmlContent,
};
```

Omit it and the sender address is used — the behaviour of every previous
version, so existing callers are unaffected.

> **Breaking change in 0.6.2.** A `Reply-To` entry placed in `headers` is now
> **removed** before sending: this field is carried by `replyTo`. RFC 5322
> allows `Reply-To` at most once, and letting a custom header compete with the
> ESP's own field left the outcome to the mail client. Callers who used that
> workaround must move the address to `replyTo` — note that the workaround never
> actually worked: the ESP's native field won.

### Custom headers

Custom `headers` now reach **every** provider, each in the shape its API
requires. Before 0.6.2 only Resend received them: Brevo's were commented out,
Postmark's were sent in a shape its API rejects, and the viewer dropped them —
which is why the `Reply-To` conflict above could go unnoticed for so long.

The `emailserviceviewer` dashboard displays the reply address and the headers
it received, so both can be checked without sending a real message.

## Receiving emails (Inbound) — since 0.7.0

Optional. It only does anything if you expose an endpoint and point your
domain's MX records at the provider.

```typescript
import { getInboundEmail, verifyInboundSignature } from '@email-service/email-service'

app.post('/inbound', async (c) => {
	// The RAW body, before any parsing — see the warning below.
	const rawBody = await c.req.text()

	const signature = verifyInboundSignature('resend', c.req.header(), rawBody, MY_SECRET)
	if (!signature.valid) return c.json({ error: signature.reason }, 401)

	const result = await getInboundEmail(
		c.req.header('user-agent') ?? '',
		JSON.parse(rawBody),
		myEspConfig,          // required for Resend, ignored by the others
	)

	if (!result.success) return c.json(result.error, result.status)

	for (const message of result.data) {
		// message.inReplyTo / message.references → which email this answers
		// message.receivedFor                   → who it was addressed to
	}
	return c.json({ ok: true })
})
```

### Things worth knowing

- **`data` is an array.** Brevo groups several messages in one webhook; the
  other providers always send one. Reach for `data[0]` if you only expect one.
- **Signature checking needs the raw body.** Once your framework has parsed the
  request, `JSON.stringify` will not reproduce the original bytes and the
  signature will never match. Read the text first, parse second. Note that only
  Resend signs its inbound webhooks (via Svix) — Postmark and Brevo protect the
  endpoint with a URL token or basic auth instead, and `verifyInboundSignature`
  reports that rather than pretending the message was verified.
- **Events and inbound messages arrive with the same `User-Agent`.** A provider
  does not distinguish them: your two endpoints do — one calling `getWebHook`,
  the other `getInboundEmail`. Send one the other's payload and you get an
  explicit error, never an empty message.
- **Attachments are never downloaded.** You get their metadata plus whatever
  handle the provider offers (`content` in base64 for Postmark, `espAttachmentId`
  for Resend and Brevo). Fetching a 25 MB file is your call, not the library's.
- **Header names are lowercased**, and repeated headers are joined with `, `.
  For threading, prefer the dedicated `references` field — it is already an array.
- **Resend costs three network calls per message** (webhook → message API → raw
  message), because its webhook carries no body and its API returns only a
  handful of headers. Postmark and Brevo cost none. Worth knowing before making
  it your production provider.

## Config by ESP

All ESP configurations share the following common parameters:

    - esp: The name of the ESP.
	- logger : boolean , trace mode (Facultatif)

### Postmark

For Postmark, you need to provide the stream and apiKey in addition to the common parameters.

```typescript
import type ConfigPostmark from '@email-service/email-service'

const emailServiceConfig : ConfigPostmark = {
	esp : 'postmark',
	stream : 'outbound'
	apiKey: 'MY_POSTMARK_APIKEY',
	logger: true
};
```

### Brevo

For Postmark, you need to provide the apiKey in addition to the common parameters.

```typescript
import type ConfigBrevo from '@email-service/email-service';

const emailServiceConfig: ConfigBrevo = {
	esp: 'brevo',
	apiKey: process.env.BREVO_API_KEY || '',
	logger:false
};
```

### email-service-viewer

E-mail, Email-service-viewer ouvert est une application Web vous permettant de tester votre application sans avoir à envoyer de mail via des EPS. 

Cette web application ne stock aucune données sur ces serveurs, vous devez donc passer à chaque appel votre configuration de WebHook

```typescript
import type ConfigBrevo from '@email-service/email-service';

const emailServiceConfig: ConfigBrevo = {
	esp: 'emailserviceviewer',
	apiToken: 'mytoken',
	webhook: 'https://my-ngrok-url.ngrok-free.app 3000/webhook',
};
```

### nodemailer

```typescript
const emailServiceConfig : ConfigNodeMailer= {
	host: 'localhost',
	port: 1025,
	auth: {
		user: 'project.1',
		pass: 'secret.1',
	},
};

# Notes

Ensure that the email server configuration (host, port, auth) matches your email service provider's requirements.
The secure option in the transporter configuration is set to false for non-SSL connections. Change this to true if SSL is required.
Always call the close method to release resources when done sending emails.
```

## Supported Input Formats

- The library allows flexible email input formats, including single email strings, comma-separated lists, and objects.

### 1. Single Email Address (String)
```ts
normalizeRecipients("john@example.com");
// Output: [{ email: "john@example.com" }]
```

### 2. Multiple Email Addresses (Comma-Separated String)
```ts
normalizeRecipients("john@example.com, jane@example.com");
// Output: [
//   { email: "john@example.com" },
//   { email: "jane@example.com" }
// ]
```

### 3. Name with Email (String)
```ts
normalizeRecipients("John Doe <john@example.com>");
// Output: [{ name: "John Doe", email: "john@example.com" }]
```

### 4. Multiple Named Emails (Comma-Separated String)
```ts
normalizeRecipients("John Doe <john@example.com>, Jane Doe <jane@example.com>");
// Output: [
//   { name: "John Doe", email: "john@example.com" },
//   { name: "Jane Doe", email: "jane@example.com" }
// ]
```

### 5. Array of Email Strings
```ts
normalizeRecipients(["john@example.com", "jane@example.com"]);
// Output: [
//   { email: "john@example.com" },
//   { email: "jane@example.com" }
// ]
```

### 6. Object Format
```ts
normalizeRecipients({ name: "Alice", email: "alice@example.com" });
// Output: [{ name: "Alice", email: "alice@example.com" }]
```

### 7. Array of Objects
```ts
normalizeRecipients([
    { name: "Bob", email: "bob@example.com" },
    "charlie@example.com",
    "Charlie Brown <charlie@example.com>"
]);
// Output: [
//   { name: "Bob", email: "bob@example.com" },
//   { email: "charlie@example.com" },
//   { name: "Charlie Brown", email: "charlie@example.com" }
// ]
```

