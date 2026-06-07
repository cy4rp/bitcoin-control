import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "control.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      ip_address TEXT NOT NULL DEFAULT '',
      points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pull_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gh_number INTEGER UNIQUE NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      body TEXT DEFAULT '',
      url TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      resolved_as TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      closed_at TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      pr_id INTEGER NOT NULL,
      ip_address TEXT NOT NULL DEFAULT '',
      vote TEXT NOT NULL CHECK(vote IN ('approve', 'reject')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (pr_id) REFERENCES pull_requests(id),
      UNIQUE(user_id, pr_id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_ip_pr
      ON votes(ip_address, pr_id)
      WHERE ip_address != '';
  `);
}

export default getDb;
