import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export function createDb(filename: string | ":memory:"): AppDatabase {
  const sqlite = new Database(filename);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(sqlite);
  return db;
}

function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monitors (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      public INTEGER NOT NULL DEFAULT 0,
      paused INTEGER NOT NULL DEFAULT 0,
      consecutive_fails INTEGER NOT NULL DEFAULT 0,
      consecutive_successes INTEGER NOT NULL DEFAULT 0,
      open_incident_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checks (
      id TEXT PRIMARY KEY NOT NULL,
      monitor_id TEXT NOT NULL,
      at INTEGER NOT NULL,
      success INTEGER NOT NULL,
      status_code INTEGER,
      response_ms INTEGER,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY NOT NULL,
      monitor_id TEXT NOT NULL,
      opened_at INTEGER NOT NULL,
      closed_at INTEGER,
      close_reason TEXT
    );
  `);

  ensureColumn(sqlite, "monitors", "consecutive_fails", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(sqlite, "monitors", "consecutive_successes", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(sqlite, "monitors", "open_incident_id", "TEXT");
}

function ensureColumn(
  sqlite: Database.Database,
  table: string,
  column: string,
  ddl: string,
) {
  const rows = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  if (rows.some((row) => row.name === column)) return;
  sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
}
