import http from 'http';

import { type Database as DatabaseType } from 'better-sqlite3';
interface CountResult {
  total: number;
}
export function handleRoutes(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  db: DatabaseType,
) {
  const url = new URL(req.url ?? '/', 'http:localhost');
  const path = url.pathname;
  if (path === '/api/stats/overview') {
    const totalSent = (
      db.prepare("SELECT COUNT(*) as total FROM emails WHERE status = 'sent'").get() as CountResult
    ).total;
    const totalFailed = (
      db
        .prepare(`SELECT COUNT(*) as total FROM emails WHERE status = 'failed'`)
        .get() as CountResult
    ).total;
    const sentToday = (
      db
        .prepare(
          `SELECT COUNT(*) as total FROM emails WHERE status = 'sent' AND date(created_at) = date('now')`,
        )
        .get() as CountResult
    ).total;
    const sentThisWeek = (
      db
        .prepare(
          `SELECT COUNT(*) as total FROM emails WHERE status = 'sent' AND created_at >= datetime('now', '-7 days')`,
        )
        .get() as CountResult
    ).total;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ totalSent, totalFailed, sentToday, sentThisWeek }));
  } else if (path === '/api/stats/daily') {
    const days = parseInt(url.searchParams.get('days') ?? '30', 10);
    const rows = db
      .prepare(
        `SELECT 
            DATE(created_at) as date,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM emails
            WHERE created_at >= datetime('now', '-' || ? || ' days')
            GROUP BY DATE(created_at)
            ORDER BY date`,
      )
      .all(days);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(rows));
  } else if (path === '/api/stats/by-tag') {
    const rows = db.prepare(`SELECT tag, COUNT(*) as total FROM emails GROUP BY tag`).all();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(rows));
  } else if (path === '/api/emails/recent') {
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
    const rows = db.prepare(`SELECT * FROM emails ORDER BY created_at DESC LIMIT ?`).all(limit);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(rows));
  }
}
