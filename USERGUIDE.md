#User Documentation

## Introduction

The NodeMailerEmailService class provides an implementation of the IEmailService interface for sending emails using NodeMailer. This documentation will guide you through the setup and usage of the NodeMailerEmailService class.

## Installation

To use the NodeMailerEmailService, ensure you have nodemailer installed in your project:

```bash
npm i @email-service/email-service
```

## Usage

Here's an example of how to use the NodeMailerEmailService class.

```typescript
const emailServiceConfig = {
  host: 'localhost',
  port: 1025,
  auth: {
    user: 'project.1',
    pass: 'secret.1',
  },
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
  html: htmlContent,
};

const emailResponse = await emailService.sendMail(emailPayload);

  if (emailResponse.ok) {
    console.log('Email sent successfully!');
  } else {
    console.log('Failed to send email:', emailResponse.error);
  }
  
emailService.close() 
```
# Notes

Ensure that the email server configuration (host, port, auth) matches your email service provider's requirements.
The secure option in the transporter configuration is set to false for non-SSL connections. Change this to true if SSL is required.
Always call the close method to release resources when done sending emails.
Conclusion

The NodeMailerEmailService class provides a straightforward way to send emails using NodeMailer in a TypeScript environment. By following the configuration and usage examples provided, you can integrate email sending functionality into your applications efficiently.