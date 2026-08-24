import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const operators = sqliteTable("operators", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export type OperatorRow = typeof operators.$inferSelect;
