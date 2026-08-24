import { createDb, type AppDatabase } from "@/lib/db/client";

export function createTestDb(): AppDatabase {
  return createDb(":memory:");
}
