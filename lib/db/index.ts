import fs from "node:fs";
import path from "node:path";
import { createDb, type AppDatabase } from "./client";

const globalForDb = globalThis as unknown as {
  __pulseDb?: AppDatabase;
};

function databasePath(): string {
  const filePath = process.env.DATABASE_PATH
    ? process.env.DATABASE_PATH
    : path.join(process.cwd(), "data", "pulse.db");
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  return filePath;
}

export function getDb(): AppDatabase {
  if (!globalForDb.__pulseDb) {
    globalForDb.__pulseDb = createDb(databasePath());
  }
  return globalForDb.__pulseDb;
}
