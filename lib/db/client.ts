import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export function createDb(filename: string | ":memory:"): AppDatabase {
  const sqlite = new Database(filename);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db);
  return db;
}

function migrate(db: AppDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
}
