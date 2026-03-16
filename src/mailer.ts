import { startAnalytics } from './analytics/server';
import { loadConfig } from './config';
import { initDatabase } from './db';
import { logEmail } from './logger';
import { RateLimiter } from './rate-limiter';
import { createSESTransport } from './transport';
import { maskEmail } from './utils/mask';
import { validateSendOptions } from './utils/validate';

export interface SendOptions {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html: string;
  tag?: string;
  attachments?: Array<{
    filename: string, 
    content: Buffer | string;
    contentType?: string;
  }>
}

export function createMailer() {
  const config = loadConfig();
  const transport = createSESTransport(config);
  const rateLimiter = new RateLimiter(config.rateLimit, config.rateLimit);
  const db = initDatabase();
  const analyticsServer = config.analyticsPort 
  ? startAnalytics(config.analyticsPort, db, config.analyticsApiKey) 
  : null;
  const send = async (options: SendOptions) => {
    await rateLimiter.consume();
    const logTo = config.maskEmails ? maskEmail(options.to) : options.to;
    const logFrom = config.maskEmails ? maskEmail(options.from ?? config.from) : (options.from ?? config.from);
    try {
      validateSendOptions(options);
      const info = await transport.sendMail({
        from: options.from ?? config.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });
      logEmail(db, {
        messageId: info.messageId,
        to: logTo,
        from: logFrom,
        subject: options.subject,
        status: 'sent',
        tag: options.tag,
      });
      return { messageId: info.messageId, status: 'sent' as const };
    } catch (error) {
      logEmail(db, {
        messageId: null,
        to: logTo,
        from: logFrom,
        subject: options.subject,
        status: 'failed',
        error: (error as Error).message,
        tag: options.tag,
      });
      return { messageId: null, status: 'failed' as const, error: (error as Error).message };
    }
  };

  return {
    send,
    sendBatch: async (messages: SendOptions[]) => {
      const results = await Promise.allSettled(messages.map((msg) => send(msg)));

      return results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return { messageId: null, status: 'failed' as const, error: result.reason.message };
      });
    },
    close: () => {
      transport.close();
      db.close();
      analyticsServer?.close();
    },
  };
}
