# sesmailer

Fast, lightweight transactional email for Node.js — powered by AWS SES

---

## Features

- **Rate-limited sending** — token bucket algorithm keeps you within SES sending limits
- **Batch sending** — send multiple emails concurrently via `Promise.allSettled`
- **SQLite email logging** — every send attempt is recorded locally
- **Built-in analytics API** — HTTP server with send stats, daily breakdowns, and tag grouping
- **Email masking** — obfuscate addresses in logs for privacy
- **Attachment support** — send files as `Buffer` or `string`
- **Zero-config** — reads from `.env` or `.sesmailerrc.json` automatically
- **TypeScript-first** — full type definitions included

---

## Quick Start

```bash
npm install sesmailer

# Optional — enables email logging and analytics
npm install better-sqlite3
```

```ts
import { createMailer } from 'sesmailer';

const mailer = createMailer();

await mailer.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<p>You are in.</p>',
});
```

---

## Configuration

sesmailer resolves config in this priority order: **explicit options → environment variables → `.sesmailerrc.json`**

### Option 1 — `.env` file

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=your-ses-smtp-password
FROM_ADDRESS=no-reply@yourdomain.com
SES_RATE_LIMIT=14
ANALYTICS_PORT=4000
ANALYTICS_API_KEY=your-secret-key
MASK_EMAILS=false
```

| Variable           | Required | Default | Description                                  |
|--------------------|----------|---------|----------------------------------------------|
| `SMTP_HOST`        | yes      | —       | SES SMTP endpoint                            |
| `SMTP_PORT`        | yes      | —       | Usually `587` (STARTTLS) or `465` (SSL)      |
| `SMTP_USER`        | yes      | —       | SES SMTP username                            |
| `SMTP_PASS`        | yes      | —       | SES SMTP password                            |
| `FROM_ADDRESS`     | yes      | —       | Default sender address                       |
| `SES_RATE_LIMIT`   | no       | `14`    | Max emails per second (match your SES quota) |
| `ANALYTICS_PORT`   | no       | —       | Port to run the analytics HTTP server on (requires `better-sqlite3`) |
| `ANALYTICS_API_KEY`| no       | —       | API key required on all analytics requests   |
| `MASK_EMAILS`      | no       | `false` | Obfuscate email addresses in logs            |

### Option 2 — `.sesmailerrc.json`

```json
{
  "smtp": {
    "host": "email-smtp.us-east-1.amazonaws.com",
    "port": 587,
    "user": "AKIAIOSFODNN7EXAMPLE",
    "pass": "your-ses-smtp-password"
  },
  "from": "no-reply@yourdomain.com",
  "rateLimit": 14,
  "analyticsPort": 4000,
  "analyticsApiKey": "your-secret-key",
  "maskEmails": false
}
```

Place `.sesmailerrc.json` in your project root. It is loaded automatically if present.

> **Warning:** `.sesmailerrc.json` may contain SMTP credentials. Add it to your `.gitignore`.

---

## API Reference

### `createMailer()`

Creates and returns a mailer instance. Loads config from environment variables or `.sesmailerrc.json`.

```ts
const mailer = createMailer({
  smtp: { host: '...', port: 465, user: '...', pass: '...' },
  from: 'noreply@example.com',
});
```

---

### `send(options)`

Sends a single email. Returns `{ messageId, status }` on success or `{ messageId: null, status: 'failed', error }` on failure — it never throws.

```ts
const result = await mailer.send({
  to: 'user@example.com',       // required
  subject: 'Hello',             // required
  html: '<p>Hello</p>',         // required
  text: 'Hello',                // optional — plain-text fallback
  from: 'me@example.com',       // optional — overrides FROM_ADDRESS
  tag: 'onboarding',            // optional — used for analytics grouping
  attachments: [],              // optional — see Attachments
});

// { messageId: '<abc@us-east-1.amazonses.com>', status: 'sent' }
```

---

### `sendBatch(messages)`

Sends an array of emails concurrently using `Promise.allSettled`. All emails are attempted regardless of individual failures. Returns an array of results in the same order as the input.

```ts
const results = await mailer.sendBatch([
  { to: 'a@example.com', subject: 'Hi A', html: '<p>Hi</p>' },
  { to: 'b@example.com', subject: 'Hi B', html: '<p>Hi</p>' },
]);

// [
//   { messageId: '...', status: 'sent' },
//   { messageId: null, status: 'failed', error: '...' }
// ]
```

---

### `close()`

Closes the SMTP transport, SQLite database connection, and analytics server (if running). Call this when your process is done sending — especially in scripts or CLI tools.

```ts
await mailer.send({ ... });
mailer.close();
```

---

## Attachments

Pass a `Buffer` or base64-encoded string with an optional `contentType`.

```ts
import { readFileSync } from 'fs';

await mailer.send({
  to: 'user@example.com',
  subject: 'Your Invoice',
  html: '<p>Please find your invoice attached.</p>',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: readFileSync('./invoice.pdf'),
      contentType: 'application/pdf',
    },
  ],
});
```

---

## Analytics API

Requires `better-sqlite3` to be installed. If not installed, the analytics server will not start.

Enable the analytics server by setting `ANALYTICS_PORT` (and optionally `ANALYTICS_API_KEY`). The server starts automatically when the mailer is created.

```
sesmailer analytics running at http://localhost:4000
```

All requests require the `x-api-key` header if `ANALYTICS_API_KEY` is set:

```bash
curl http://localhost:4000/api/stats/overview \
  -H "x-api-key: your-secret-key"
```

### Endpoints

**`GET /api/stats/overview`**

```json
{
  "totalSent": 1024,
  "totalFailed": 3,
  "sentToday": 47,
  "sentThisWeek": 312
}
```

**`GET /api/stats/daily?days=30`**

```json
[
  { "date": "2026-03-01", "sent": 42, "failed": 1 },
  { "date": "2026-03-02", "sent": 58, "failed": 0 }
]
```

**`GET /api/stats/by-tag`**

```json
[
  { "tag": "onboarding", "total": 210 },
  { "tag": "password-reset", "total": 88 }
]
```

**`GET /api/emails/recent?limit=50`**

```json
[
  {
    "id": 1,
    "message_id": "<abc@us-east-1.amazonses.com>",
    "to": "user@example.com",
    "from": "no-reply@yourdomain.com",
    "subject": "Welcome!",
    "status": "sent",
    "tag": "onboarding",
    "error": null,
    "created_at": "2026-03-15T10:22:00.000Z"
  }
]
```

---

## Email Masking

When `MASK_EMAILS=true` (or `maskEmails: true`), email addresses stored in the SQLite log are obfuscated before writing:

```
user@example.com  →  u***@example.com
```

The actual email sent to SES is unaffected — only the logged value is masked.

---

## AWS SES Setup

1. Go to the [AWS Console](https://console.aws.amazon.com/) → **Simple Email Service** → **SMTP Settings**
2. Click **Create SMTP Credentials** — this generates an IAM user with SES send permissions
3. Copy the **SMTP Username** and **SMTP Password** (shown only once)
4. Use these as `SMTP_USER` and `SMTP_PASS`

> **Note:** SES SMTP credentials are not the same as your AWS access keys. Do not use your AWS access key ID and secret access key here.

**Sandbox mode:** New SES accounts start in sandbox mode, which only allows sending to verified email addresses. Request production access from the SES console to send to arbitrary recipients.

---

## Important Notes

- **Not compatible with serverless** — If using better-sqlite3 for logging, a persistent writable file system is required. Logging will not work on Vercel, AWS Lambda, or similar ephemeral environments.
- **Logging is optional** — sesmailer works without `better-sqlite3`. Install it only if you want email logging and the analytics API. Without it, sesmailer still sends emails with full rate limiting and validation.
- **`status: 'sent'` means SES accepted the message**, not that it was delivered to the inbox. Bounces and complaints are handled separately via SES notifications.
- **The `sesmailer.db` file** contains all email metadata including addresses and subjects. Ensure appropriate file permissions on your server, and add it to `.gitignore`.
- **Set `SES_RATE_LIMIT` to match your account quota.** The default is `14` emails/second, which matches the SES sandbox limit. Check your SES account's sending rate in the console and update accordingly.

---

## License

MIT
