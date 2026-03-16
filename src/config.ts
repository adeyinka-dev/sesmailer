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
}

export function loadConfig(options?: Partial<SESMailerConfig>): SESMailerConfig {
  const analyticsApiKey = options?.analyticsApiKey ?? process.env.ANALYTICS_API_KEY;
  const analyticsPort = options?.analyticsPort ?? (Number(process.env.ANALYTICS_PORT) || undefined);
  const host = options?.smtp?.host ?? process.env.SMTP_HOST;
  if (!host) throw new Error('sesmailer: SMTP_HOST is required');
  const port = options?.smtp?.port ?? Number(process.env.SMTP_PORT);
  if (!port || isNaN(port)) throw new Error('sesmailer: SMTP_PORT must be a valid number');
  const user = options?.smtp?.user ?? process.env.SMTP_USER;
  if (!user) throw new Error('sesmailer: SMTP_USER is required');
  const pass = options?.smtp?.pass ?? process.env.SMTP_PASS;
  if (!pass) throw new Error('sesmailer: SMTP_PASS is required');
  const rateLimit = options?.rateLimit ?? (Number(process.env.SES_RATE_LIMIT) || 14);
  const from = options?.from ?? process.env.FROM_ADDRESS;
  if (!from) throw new Error('sesmailer: Please set a from email address');

  return {
    smtp: { host, port, user, pass },
    rateLimit: rateLimit,
    from: from,
    analyticsApiKey,
    analyticsPort,
  };
}
