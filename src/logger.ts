import { type Database as DatabaseType } from 'better-sqlite3';

interface EmailLog {
  messageId: string | null;
  to: string;
  from: string;
  subject: string;
  status: 'sent' | 'failed';
  error?: string;
  tag?: string;
}

export function logEmail(db: DatabaseType, info: EmailLog) {
  db.prepare(
    'INSERT INTO emails ( message_id, to_address, from_address, subject, status, error, tag, created_at, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    info.messageId,
    info.to,
    info.from,
    info.subject,
    info.status,
    info.error ?? null,
    info.tag ?? null,
    new Date().toISOString(),
    info.status === 'sent' ? new Date().toISOString() : null,
  );
}
