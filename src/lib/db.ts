import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "control.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    migrateSchema(db);
    db.pragma("foreign_keys = ON");
    _db = db;
  }
  return _db;
}

function hasColumn(
  db: Database.Database,
  table: string,
  column: string
): boolean {
  const info = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM pragma_table_info('${table}') WHERE name='${column}'`
    )
    .get() as { cnt: number };
  return info.cnt > 0;
}

function tableExists(db: Database.Database, table: string): boolean {
  const info = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name=?`
    )
    .get(table) as { cnt: number };
  return info.cnt > 0;
}

function migrateSchema(db: Database.Database) {
  db.pragma("foreign_keys = OFF");

  // ---- Migration 1: Add ip_address to users if missing ----
  if (tableExists(db, "users") && !hasColumn(db, "users", "ip_address")) {
    db.exec(
      `ALTER TABLE users ADD COLUMN ip_address TEXT NOT NULL DEFAULT ''`
    );
  }

  // ---- Migration 2: Add ip_address to votes if missing ----
  if (tableExists(db, "votes") && !hasColumn(db, "votes", "ip_address")) {
    db.exec(
      `ALTER TABLE votes ADD COLUMN ip_address TEXT NOT NULL DEFAULT ''`
    );
  }

  // ---- Migration 3: Migrate pull_requests from GitHub to hub schema ----
  if (
    tableExists(db, "pull_requests") &&
    hasColumn(db, "pull_requests", "gh_number")
  ) {
    const migrate = db.transaction(() => {
      db.exec(`ALTER TABLE pull_requests RENAME TO _pull_requests_old`);

      db.exec(`
        CREATE TABLE pull_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pr_number INTEGER NOT NULL,
          repo TEXT NOT NULL DEFAULT 'Bitcoin',
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          body TEXT DEFAULT '',
          branch TEXT DEFAULT '',
          base_branch TEXT DEFAULT 'initial',
          diff_text TEXT DEFAULT '',
          status TEXT DEFAULT 'open',
          resolved_as TEXT DEFAULT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          closed_at TEXT DEFAULT NULL,
          UNIQUE(repo, pr_number)
        )
      `);

      db.exec(`
        INSERT INTO pull_requests (id, pr_number, repo, title, author, body, status, resolved_as, created_at, closed_at)
        SELECT id, gh_number, 'Bitcoin', title, author, body, status, resolved_as, created_at, closed_at
        FROM _pull_requests_old
      `);

      db.exec(`DROP TABLE _pull_requests_old`);
    });
    migrate();
  }

  // ---- Create tables if they don't exist (fresh install) ----
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
      pr_number INTEGER NOT NULL,
      repo TEXT NOT NULL DEFAULT 'Bitcoin',
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      body TEXT DEFAULT '',
      branch TEXT DEFAULT '',
      base_branch TEXT DEFAULT 'initial',
      diff_text TEXT DEFAULT '',
      status TEXT DEFAULT 'open',
      resolved_as TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      closed_at TEXT DEFAULT NULL,
      UNIQUE(repo, pr_number)
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

    CREATE TABLE IF NOT EXISTS repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      default_branch TEXT DEFAULT 'initial',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export default getDb;
