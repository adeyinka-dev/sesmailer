import { readFileSync, existsSync } from 'fs';
import { join } from 'path';


export interface SESMailerConfig {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  rateLimit: number;
  from: string;
  analyticsApiKey?: string;
  analyticsPort?: number;
  maskEmails?: boolean;
}


export function loadConfig(options?: Partial<SESMailerConfig>): SESMailerConfig {
  let fileConfig: Partial<SESMailerConfig> = {};
  const configPath = join(process.cwd(), '.sesmailerrc.json');
  if (existsSync(configPath)) {
    fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
  }
  const analyticsApiKey = options?.analyticsApiKey ?? process.env.ANALYTICS_API_KEY ?? fileConfig.analyticsApiKey;
  const analyticsPort = options?.analyticsPort ?? (Number(process.env.ANALYTICS_PORT) || undefined) ?? fileConfig.analyticsPort;
  const maskEmails = options?.maskEmails 
  ?? (process.env.MASK_EMAILS ? process.env.MASK_EMAILS === 'true' : undefined) 
  ?? fileConfig.maskEmails 
  ?? false;
  const host = options?.smtp?.host ?? process.env.SMTP_HOST ?? fileConfig.smtp?.host;
  if (!host) throw new Error('sesmailer: SMTP_HOST is required');
  const port = options?.smtp?.port ?? (Number(process.env.SMTP_PORT) || undefined) ?? fileConfig.smtp?.port;
  if (!port || isNaN(port)) throw new Error('sesmailer: SMTP_PORT must be a valid number');
  const user = options?.smtp?.user ?? process.env.SMTP_USER ?? fileConfig.smtp?.user;
  if (!user) throw new Error('sesmailer: SMTP_USER is required');
  const pass = options?.smtp?.pass ?? process.env.SMTP_PASS ?? fileConfig.smtp?.pass;
  if (!pass) throw new Error('sesmailer: SMTP_PASS is required');
  const rateLimit = options?.rateLimit ?? (Number(process.env.SES_RATE_LIMIT) || undefined) ?? fileConfig.rateLimit ?? 14;
  const from = options?.from ?? process.env.FROM_ADDRESS ?? fileConfig.from;
  if (!from) throw new Error('sesmailer: Please set a from email address');

  return {
    smtp: { host, port, user, pass },
    rateLimit: rateLimit,
    from: from,
    analyticsApiKey,
    analyticsPort,
    maskEmails,
  };
}
