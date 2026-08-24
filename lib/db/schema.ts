import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const operators = sqliteTable("operators", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const monitors = sqliteTable("monitors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  public: integer("public", { mode: "boolean" }).notNull().default(false),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false),
  consecutiveFails: integer("consecutive_fails").notNull().default(0),
  consecutiveSuccesses: integer("consecutive_successes").notNull().default(0),
  openIncidentId: text("open_incident_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const checks = sqliteTable("checks", {
  id: text("id").primaryKey(),
  monitorId: text("monitor_id").notNull(),
  at: integer("at", { mode: "timestamp_ms" }).notNull(),
  success: integer("success", { mode: "boolean" }).notNull(),
  statusCode: integer("status_code"),
  responseMs: integer("response_ms"),
  error: text("error"),
});

export const incidents = sqliteTable("incidents", {
  id: text("id").primaryKey(),
  monitorId: text("monitor_id").notNull(),
  openedAt: integer("opened_at", { mode: "timestamp_ms" }).notNull(),
  closedAt: integer("closed_at", { mode: "timestamp_ms" }),
  closeReason: text("close_reason"),
});

export type OperatorRow = typeof operators.$inferSelect;
export type MonitorRow = typeof monitors.$inferSelect;
export type CheckRow = typeof checks.$inferSelect;
export type IncidentRow = typeof incidents.$inferSelect;
