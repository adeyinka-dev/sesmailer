import Database, { type Database as DatabaseType } from 'better-sqlite3';

export function initDatabase(path: string = './sesmailer.db'): DatabaseType {
  const db = new Database(path);
  db.exec(`
        CREATE TABLE IF NOT EXISTS emails(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT,
            to_address TEXT, 
            from_address TEXT, 
            subject TEXT, 
            status TEXT, 
            error TEXT, 
            tag TEXT, 
            created_at TEXT, 
            sent_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_name ON emails (created_at);
        CREATE INDEX IF NOT EXISTS idx_status ON emails (status);
        CREATE INDEX IF NOT EXISTS idx_tag ON emails (tag);
    `);
  return db;
}
