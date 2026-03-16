import http from 'http';
import { handleRoutes } from './route';
import { type Database as DatabaseType } from 'better-sqlite3';

export function startAnalytics(
  port: number,
  db: DatabaseType,
  apiKey?: string,
) {
  const server = http.createServer((req, res) => {
    if (apiKey) {
      const requestKey = req.headers['x-api-key'];
      if (requestKey !== apiKey) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
    }

    if (req.url === '/') {
      res.end('Analytics home');
    } else {
      handleRoutes(req, res, db);
    }
  });

  server.listen(port, () => {
    console.log(`sesmailer analytics running at http://localhost:${port}`);
  });

  return server;
}