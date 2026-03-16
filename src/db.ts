// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Database: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Database = require('better-sqlite3');
} catch {
  // better-sqlite3 not installed — logging disabled
}
export function initDatabase(path: string = './sesmailer.db') {
  if (!Database) return null;

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
