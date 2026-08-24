import { and, desc, eq, gte, isNull, lt } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db/client";
import {
  checks,
  hourlySummaries,
  incidents,
  monitors,
  stateSegments,
} from "@/lib/db/schema";

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

export type StatusIncident = {
  id: string;
  openedAt: number;
  closedAt: number | null;
  closeReason: string | null;
};

export type StatusSeriesPoint = {
  at: number;
  responseMs: number;
};

export type StatusMonitorView = {
  id: string;
  name: string;
  state: MonitorState;
  availability90d: number;
  series: StatusSeriesPoint[];
  incidents: StatusIncident[];
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

const HOUR_MS = 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const RECENT_INCIDENT_LIMIT = 10;

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

  openSegment(db, id, "Up", at);

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
  db.delete(stateSegments).where(eq(stateSegments.monitorId, id)).run();
  db.delete(hourlySummaries).where(eq(hourlySummaries.monitorId, id)).run();
  db.delete(monitors).where(eq(monitors.id, id)).run();
}

export function listMonitors(db: AppDatabase): Monitor[] {
  return loadMonitorRows(db).map(toMonitor);
}

export function listPublicMonitors(db: AppDatabase): Monitor[] {
  return loadMonitorRows(db)
    .filter((row) => row.public)
    .map(toMonitor);
}

export function listRunnableMonitors(db: AppDatabase): Monitor[] {
  return loadMonitorRows(db)
    .filter((row) => !row.paused)
    .map(toMonitor);
}

export function getMonitor(db: AppDatabase, id: string): Monitor {
  return toMonitor(loadMonitorRow(db, id));
}

export function getStatusPage(db: AppDatabase, now: number): StatusMonitorView[] {
  return listPublicMonitors(db).map((monitor) =>
    buildStatusView(db, monitor, now),
  );
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
      switchSegment(db, id, "Up", input.at);
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
      switchSegment(db, id, "Down", input.at);
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

  switchSegment(db, id, "Paused", at);

  return { monitor: getMonitor(db, id), intents };
}

export function resumeMonitor(
  db: AppDatabase,
  id: string,
  at: number,
): { monitor: Monitor; intents: NotificationIntent[] } {
  const row = loadMonitorRow(db, id);
  if (!row.paused) {
    return { monitor: toMonitor(row), intents: [] };
  }

  db.update(monitors)
    .set({
      paused: false,
      consecutiveFails: 0,
      consecutiveSuccesses: 0,
    })
    .where(eq(monitors.id, id))
    .run();

  switchSegment(db, id, "Up", at);

  return { monitor: getMonitor(db, id), intents: [] };
}

export function rotateChecks(db: AppDatabase, now: number): void {
  const cutoff = now - THIRTY_DAYS_MS;
  const old = db
    .select()
    .from(checks)
    .where(lt(checks.at, new Date(cutoff)))
    .all();

  for (const check of old) {
    const hourStart = Math.floor(toMs(check.at) / HOUR_MS) * HOUR_MS;
    mergeHourlySummary(
      db,
      check.monitorId,
      hourStart,
      check.success,
      check.responseMs,
    );
    db.delete(checks).where(eq(checks.id, check.id)).run();
  }
}

function mergeHourlySummary(
  db: AppDatabase,
  monitorId: string,
  hourStart: number,
  success: boolean,
  responseMs: number | null,
) {
  const existing = db
    .select()
    .from(hourlySummaries)
    .where(
      and(
        eq(hourlySummaries.monitorId, monitorId),
        eq(hourlySummaries.hourStart, new Date(hourStart)),
      ),
    )
    .get();

  if (!existing) {
    db.insert(hourlySummaries)
      .values({
        id: randomUUID(),
        monitorId,
        hourStart: new Date(hourStart),
        successful: success ? 1 : 0,
        failed: success ? 0 : 1,
        averageResponseMs: responseMs,
      })
      .run();
    return;
  }

  const successful = existing.successful + (success ? 1 : 0);
  const failed = existing.failed + (success ? 0 : 1);
  const previousCount = existing.successful + existing.failed;
  let averageResponseMs = existing.averageResponseMs;
  if (responseMs != null) {
    if (averageResponseMs == null) {
      averageResponseMs = responseMs;
    } else {
      averageResponseMs = Math.round(
        (averageResponseMs * previousCount + responseMs) / (previousCount + 1),
      );
    }
  }

  db.update(hourlySummaries)
    .set({ successful, failed, averageResponseMs })
    .where(eq(hourlySummaries.id, existing.id))
    .run();
}

function buildStatusView(
  db: AppDatabase,
  monitor: Monitor,
  now: number,
): StatusMonitorView {
  const windowStart = now - NINETY_DAYS_MS;
  return {
    id: monitor.id,
    name: monitor.name,
    state: monitor.state,
    availability90d: availabilityFor(db, monitor.id, windowStart, now),
    series: seriesFor(db, monitor.id, windowStart),
    incidents: incidentsFor(db, monitor.id),
  };
}

function availabilityFor(
  db: AppDatabase,
  monitorId: string,
  windowStart: number,
  now: number,
): number {
  const segments = db
    .select()
    .from(stateSegments)
    .where(eq(stateSegments.monitorId, monitorId))
    .all();

  let up = 0;
  let down = 0;
  for (const segment of segments) {
    const start = toMs(segment.startedAt);
    const end = segment.endedAt ? toMs(segment.endedAt) : now;
    const clipped = Math.max(
      0,
      Math.min(end, now) - Math.max(start, windowStart),
    );
    if (segment.state === "Up") up += clipped;
    if (segment.state === "Down") down += clipped;
  }

  const denom = up + down;
  return denom === 0 ? 1 : up / denom;
}

function seriesFor(
  db: AppDatabase,
  monitorId: string,
  windowStart: number,
): StatusSeriesPoint[] {
  const checkPoints = db
    .select()
    .from(checks)
    .where(
      and(eq(checks.monitorId, monitorId), gte(checks.at, new Date(windowStart))),
    )
    .all()
    .filter((row) => row.responseMs != null)
    .map((row) => ({ at: toMs(row.at), responseMs: row.responseMs as number }));

  const summaryPoints = db
    .select()
    .from(hourlySummaries)
    .where(
      and(
        eq(hourlySummaries.monitorId, monitorId),
        gte(hourlySummaries.hourStart, new Date(windowStart)),
      ),
    )
    .all()
    .filter((row) => row.averageResponseMs != null)
    .map((row) => ({
      at: toMs(row.hourStart),
      responseMs: row.averageResponseMs as number,
    }));

  return [...summaryPoints, ...checkPoints].sort((a, b) => a.at - b.at);
}

function incidentsFor(db: AppDatabase, monitorId: string): StatusIncident[] {
  return db
    .select()
    .from(incidents)
    .where(eq(incidents.monitorId, monitorId))
    .orderBy(desc(incidents.openedAt))
    .limit(RECENT_INCIDENT_LIMIT)
    .all()
    .map((row) => ({
      id: row.id,
      openedAt: toMs(row.openedAt),
      closedAt: row.closedAt ? toMs(row.closedAt) : null,
      closeReason: row.closeReason,
    }));
}

function switchSegment(
  db: AppDatabase,
  monitorId: string,
  state: MonitorState,
  at: number,
) {
  closeOpenSegment(db, monitorId, at);
  openSegment(db, monitorId, state, at);
}

function closeOpenSegment(db: AppDatabase, monitorId: string, at: number) {
  const open = db
    .select()
    .from(stateSegments)
    .where(
      and(eq(stateSegments.monitorId, monitorId), isNull(stateSegments.endedAt)),
    )
    .get();
  if (!open) return;
  db.update(stateSegments)
    .set({ endedAt: new Date(at) })
    .where(eq(stateSegments.id, open.id))
    .run();
}

function openSegment(
  db: AppDatabase,
  monitorId: string,
  state: MonitorState,
  at: number,
) {
  db.insert(stateSegments)
    .values({
      id: randomUUID(),
      monitorId,
      state,
      startedAt: new Date(at),
      endedAt: null,
    })
    .run();
}

function toMs(value: Date | number): number {
  return value instanceof Date ? value.getTime() : value;
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

export function loadIncident(
  db: AppDatabase,
  incidentId: string,
): { openedAt: number; closedAt: number | null; closeReason: string | null } | null {
  const row = db
    .select()
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .get();
  if (!row) return null;
  return {
    openedAt: toMs(row.openedAt),
    closedAt: row.closedAt ? toMs(row.closedAt) : null,
    closeReason: row.closeReason,
  };
}
