import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db/client";
import { checks, incidents, monitors } from "@/lib/db/schema";

export type MonitorState = "Up" | "Down" | "Paused";

export type Monitor = {
  id: string;
  name: string;
  url: string;
  public: boolean;
  paused: boolean;
  state: MonitorState;
};

export type MonitorInput = {
  name: string;
  url: string;
  public: boolean;
};

export type CheckInput = {
  at: number;
  statusCode?: number | null;
  responseMs?: number | null;
  error?: string | null;
};

export type RecordedCheck = {
  id: string;
  at: number;
  success: boolean;
  statusCode: number | null;
  responseMs: number | null;
  error: string | null;
};

export type NotificationIntent =
  | { kind: "incident_opened"; monitorId: string; incidentId: string }
  | {
      kind: "incident_closed";
      monitorId: string;
      incidentId: string;
      reason: "recovered" | "paused";
    };

type MonitorRow = {
  id: string;
  name: string;
  url: string;
  public: boolean;
  paused: boolean;
  consecutiveFails: number;
  consecutiveSuccesses: number;
  openIncidentId: string | null;
};

export function createMonitor(
  db: AppDatabase,
  input: MonitorInput,
  at: number,
): { monitor: Monitor } {
  const name = requireName(input.name);
  const url = requireHttpUrl(input.url);
  assertUrlUnique(db, url);

  const id = randomUUID();
  db.insert(monitors)
    .values({
      id,
      name,
      url,
      public: input.public,
      paused: false,
      consecutiveFails: 0,
      consecutiveSuccesses: 0,
      openIncidentId: null,
      createdAt: new Date(at),
    })
    .run();

  return { monitor: getMonitor(db, id) };
}

export function updateMonitor(
  db: AppDatabase,
  id: string,
  input: MonitorInput,
): { monitor: Monitor } {
  const existing = loadMonitorRow(db, id);
  const name = requireName(input.name);
  const url = requireHttpUrl(input.url);
  assertUrlUnique(db, url, id);

  db.update(monitors)
    .set({
      name,
      url,
      public: input.public,
    })
    .where(eq(monitors.id, existing.id))
    .run();

  return { monitor: getMonitor(db, id) };
}

export function deleteMonitor(db: AppDatabase, id: string): void {
  loadMonitorRow(db, id);
  db.delete(checks).where(eq(checks.monitorId, id)).run();
  db.delete(incidents).where(eq(incidents.monitorId, id)).run();
  db.delete(monitors).where(eq(monitors.id, id)).run();
}

export function listMonitors(db: AppDatabase): Monitor[] {
  return loadMonitorRows(db).map(toMonitor);
}

export function listRunnableMonitors(db: AppDatabase): Monitor[] {
  return loadMonitorRows(db)
    .filter((row) => !row.paused)
    .map(toMonitor);
}

export function getMonitor(db: AppDatabase, id: string): Monitor {
  return toMonitor(loadMonitorRow(db, id));
}

export function recordCheck(
  db: AppDatabase,
  id: string,
  input: CheckInput,
): { monitor: Monitor; intents: NotificationIntent[]; check: RecordedCheck } {
  const row = loadMonitorRow(db, id);
  if (row.paused) throw new Error("paused");

  const success = isSuccessfulCheck(input);
  const checkId = randomUUID();
  const check: RecordedCheck = {
    id: checkId,
    at: input.at,
    success,
    statusCode: input.statusCode ?? null,
    responseMs: input.responseMs ?? null,
    error: input.error ?? null,
  };

  db.insert(checks)
    .values({
      id: check.id,
      monitorId: id,
      at: new Date(input.at),
      success: check.success,
      statusCode: check.statusCode,
      responseMs: check.responseMs,
      error: check.error,
    })
    .run();

  const intents: NotificationIntent[] = [];
  let consecutiveFails = row.consecutiveFails;
  let consecutiveSuccesses = row.consecutiveSuccesses;
  let openIncidentId = row.openIncidentId;

  if (success) {
    consecutiveSuccesses += 1;
    consecutiveFails = 0;
    if (openIncidentId && consecutiveSuccesses >= 3) {
      db.update(incidents)
        .set({
          closedAt: new Date(input.at),
          closeReason: "recovered",
        })
        .where(eq(incidents.id, openIncidentId))
        .run();
      intents.push({
        kind: "incident_closed",
        monitorId: id,
        incidentId: openIncidentId,
        reason: "recovered",
      });
      openIncidentId = null;
    }
  } else {
    consecutiveFails += 1;
    consecutiveSuccesses = 0;
    if (!openIncidentId && consecutiveFails >= 3) {
      const incidentId = randomUUID();
      db.insert(incidents)
        .values({
          id: incidentId,
          monitorId: id,
          openedAt: new Date(input.at),
          closedAt: null,
          closeReason: null,
        })
        .run();
      openIncidentId = incidentId;
      intents.push({
        kind: "incident_opened",
        monitorId: id,
        incidentId,
      });
    }
  }

  db.update(monitors)
    .set({
      consecutiveFails,
      consecutiveSuccesses,
      openIncidentId,
    })
    .where(eq(monitors.id, id))
    .run();

  return { monitor: getMonitor(db, id), intents, check };
}

export function pauseMonitor(
  db: AppDatabase,
  id: string,
  at: number,
): { monitor: Monitor; intents: NotificationIntent[] } {
  const row = loadMonitorRow(db, id);
  const intents: NotificationIntent[] = [];

  if (row.paused) {
    return { monitor: toMonitor(row), intents };
  }

  let openIncidentId = row.openIncidentId;
  if (openIncidentId) {
    db.update(incidents)
      .set({
        closedAt: new Date(at),
        closeReason: "paused",
      })
      .where(eq(incidents.id, openIncidentId))
      .run();
    intents.push({
      kind: "incident_closed",
      monitorId: id,
      incidentId: openIncidentId,
      reason: "paused",
    });
    openIncidentId = null;
  }

  db.update(monitors)
    .set({
      paused: true,
      consecutiveFails: 0,
      consecutiveSuccesses: 0,
      openIncidentId,
    })
    .where(eq(monitors.id, id))
    .run();

  return { monitor: getMonitor(db, id), intents };
}

export function resumeMonitor(
  db: AppDatabase,
  id: string,
  _at: number,
): { monitor: Monitor; intents: NotificationIntent[] } {
  loadMonitorRow(db, id);
  db.update(monitors)
    .set({
      paused: false,
      consecutiveFails: 0,
      consecutiveSuccesses: 0,
    })
    .where(eq(monitors.id, id))
    .run();

  return { monitor: getMonitor(db, id), intents: [] };
}

function isSuccessfulCheck(input: CheckInput): boolean {
  if (input.error) return false;
  const code = input.statusCode;
  return typeof code === "number" && code >= 200 && code < 400;
}

function loadMonitorRows(db: AppDatabase): MonitorRow[] {
  return db
    .select({
      id: monitors.id,
      name: monitors.name,
      url: monitors.url,
      public: monitors.public,
      paused: monitors.paused,
      consecutiveFails: monitors.consecutiveFails,
      consecutiveSuccesses: monitors.consecutiveSuccesses,
      openIncidentId: monitors.openIncidentId,
    })
    .from(monitors)
    .all();
}

function loadMonitorRow(db: AppDatabase, id: string): MonitorRow {
  const row = db
    .select({
      id: monitors.id,
      name: monitors.name,
      url: monitors.url,
      public: monitors.public,
      paused: monitors.paused,
      consecutiveFails: monitors.consecutiveFails,
      consecutiveSuccesses: monitors.consecutiveSuccesses,
      openIncidentId: monitors.openIncidentId,
    })
    .from(monitors)
    .where(eq(monitors.id, id))
    .get();

  if (!row) throw new Error("not_found");
  return row;
}

function toMonitor(row: MonitorRow): Monitor {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    public: row.public,
    paused: row.paused,
    state: row.paused ? "Paused" : row.openIncidentId ? "Down" : "Up",
  };
}

function requireName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("name_required");
  return trimmed;
}

function requireHttpUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("invalid_url");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("invalid_url");
  }
  return url;
}

function assertUrlUnique(db: AppDatabase, url: string, exceptId?: string) {
  const row = db
    .select({ id: monitors.id })
    .from(monitors)
    .where(eq(monitors.url, url))
    .get();
  if (row && row.id !== exceptId) {
    throw new Error("url_not_unique");
  }
}
