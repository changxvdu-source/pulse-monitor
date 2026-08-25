import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const operators = sqliteTable("operators", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  locale: text("locale").notNull().default("en"),
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
  notificationEmail: text("notification_email"),
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

export const stateSegments = sqliteTable("state_segments", {
  id: text("id").primaryKey(),
  monitorId: text("monitor_id").notNull(),
  state: text("state").notNull(),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  endedAt: integer("ended_at", { mode: "timestamp_ms" }),
});

export const hourlySummaries = sqliteTable("hourly_summaries", {
  id: text("id").primaryKey(),
  monitorId: text("monitor_id").notNull(),
  hourStart: integer("hour_start", { mode: "timestamp_ms" }).notNull(),
  successful: integer("successful").notNull(),
  failed: integer("failed").notNull(),
  averageResponseMs: integer("average_response_ms"),
});

export type OperatorRow = typeof operators.$inferSelect;
export type MonitorRow = typeof monitors.$inferSelect;
export type CheckRow = typeof checks.$inferSelect;
export type IncidentRow = typeof incidents.$inferSelect;
