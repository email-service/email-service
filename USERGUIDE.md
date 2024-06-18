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
