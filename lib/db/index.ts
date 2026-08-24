import fs from "node:fs";
import path from "node:path";
import { createDb, type AppDatabase } from "./client";

const globalForDb = globalThis as unknown as {
  __pulseDb?: AppDatabase;
};

function databasePath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "pulse.db");
}

export function getDb(): AppDatabase {
  if (!globalForDb.__pulseDb) {
    globalForDb.__pulseDb = createDb(databasePath());
  }
  return globalForDb.__pulseDb;
}
