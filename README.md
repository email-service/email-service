**Warning: Package Under Development**

>Please be advised that this npm package is currently under development (beta). It is not yet ready for production use. We plan to release version 1.0 by the end of July. Until then, we recommend not using this package in any critical or production environments. Thank you for your understanding and patience.

## Motivation
email-service is a versatile npm package designed to simplify the integration and standardization of email communications across multiple Email Service Providers (ESPs).

- **Simplified API:** Offers a single, consistent API that abstracts the complexities of individual ESPs, allowing for easy integration and fewer implementation errors.
- **Robust Error Handling:** Gracefully handles errors and provides detailed logs, ensuring reliability and ease of debugging.

## Installation
To use the email-service, ensure you have email-service package installed in your project:

```bash
npm i @email-service/email-service
```
## Quick start

```js
import { getEmailService } from '@email-service/email-service';

// Choose the service
const config = {
	esp: 'brevo', // or 'postmatk' or 'resend' or 'emailserviceviewer'
	apiKey: 'my_API_KEY',
};

// Get the service
const emailESP = getEmailService(config);

if (emailESP) {
	
	// Create the email payload
	let emailPayload = {
		to: 'romain@exemple.com',
		from: 'myserver@mysite.com',
		subject: 'Test',
		text: 'This is a test',
		html: '<h1>Test</h1><p>This is a test</p>',
		metaData: { testMetaData: 'my test' },
	};

	// Send the email
	const emailSended = await emailESP.sendEmail(emailPayload);

	// Check if the email is sended
	if (emailSended.success) {
		console.log('Email sended whith id:', emailSended.data.messageId);
	} else {
		console.log('Email not sended, error:', emailSended.error);
	}
}
```

## Available ESPs

- [Postmark](https://postmarkapp.com)
```JS
const conf = {
	esp : 'postmark',
	stream : 'outbound' // Default name stream for Postmark are outbound
	apiKey : MY_TOKEN_API
}
```
- [Brevo](https://www.brevo.com)
```JS
const conf = {
	esp : 'brevo',
	apiKey : MY_TOKEN_API
}
```
- [Resend](https://www.resend.com)
```JS
const conf = {
	esp : 'resend',
	apiKey : MY_TOKEN_API
}
```
- [Email-service-viewer](https://www.email-service.dev)

Email-service-viewer is a companion product that allows you to test your applications without having accounts with an ESP (Email Service Provider). It particularly enables you to test different 'Bounces' scenarios without impacting your reputation.
```JS
const conf = {
	esp : 'emailserviceviewer',
	apiToken : MY_TOKEN_API,
	wehhook : 'https://my-ngrok-adresse.ngrok-free.app/api/my-weebhook-api'
}
```

## Errors management

Regardless of the ESP, the error codes returned by `sendMail` are always the same:

```JS
type sendEmailError =
	| 'UNAUTHORIZED'
	| 'EMAIL_INVALID'
	| 'PARAM_INVALID'
	| 'ACCOUNT_INVALID'
	| 'INACTIVE_RECIPIENT'
	| 'SERVER_EXCEPTION'
```
