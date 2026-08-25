import { and, asc, desc, eq, gte, isNull, lt, lte } from "drizzle-orm";
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

export type LastCheck = {
  at: number;
  success: boolean;
  statusCode: number | null;
  responseMs: number | null;
  error: string | null;
};

export type StatusMonitorView = {
  id: string;
  name: string;
  url: string;
  public: boolean;
  paused: boolean;
  state: MonitorState;
  availability90d: number;
  series: StatusSeriesPoint[];
  incidents: StatusIncident[];
  calendar: CalendarDay[];
  lastCheck: LastCheck | null;
  typicalResponseMs: number | null;
  slowerThanUsual: boolean;
  isolatedFailedChecks7d: number;
  upSince: number | null;
};

export type OverallStatus = "empty" | "up" | "down" | "paused";

export type StatusHighlight =
  | { kind: "empty" }
  | { kind: "down"; name: string }
  | { kind: "paused" }
  | { kind: "slower"; name: string; responseMs: number; typicalMs: number }
  | { kind: "isolated_fails"; name: string; count: number }
  | { kind: "checked"; name: string; at: number }
  | { kind: "up" };

export type HighlightMonitor = {
  name: string;
  state: MonitorState;
  slowerThanUsual: boolean;
  isolatedFailedChecks7d: number;
  lastCheck: { at: number; responseMs: number | null } | null;
  typicalResponseMs?: number | null;
};

export type CalendarDayKind = "none" | "up" | "down" | "paused" | "mixed";

export type CalendarDay = {
  at: number;
  kind: CalendarDayKind;
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
const DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * DAY_MS;
const THIRTY_DAYS_MS = 30 * DAY_MS;
const NINETY_DAYS_MS = 90 * DAY_MS;
const CALENDAR_DAYS = 90;
const RECENT_INCIDENT_LIMIT = 10;
const RECENT_CHECK_LIMIT = 20;
const TYPICAL_MIN_SAMPLES = 3;
const SLOWER_RATIO = 1.5;
const SLOWER_MIN_DELTA_MS = 50;

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

export function getMonitorStatusView(
  db: AppDatabase,
  id: string,
  now: number,
): StatusMonitorView {
  return buildStatusView(db, getMonitor(db, id), now);
}

export function listMonitorStatusViews(
  db: AppDatabase,
  now: number,
): StatusMonitorView[] {
  return listMonitors(db).map((monitor) => buildStatusView(db, monitor, now));
}

export function overallStatus(
  views: Array<{ state: MonitorState }>,
): OverallStatus {
  if (views.length === 0) return "empty";
  if (views.some((view) => view.state === "Down")) return "down";
  if (views.every((view) => view.state === "Paused")) return "paused";
  return "up";
}

export function overallHighlight(views: HighlightMonitor[]): StatusHighlight {
  if (views.length === 0) return { kind: "empty" };

  const down = views.find((view) => view.state === "Down");
  if (down) return { kind: "down", name: down.name };
  if (views.every((view) => view.state === "Paused")) return { kind: "paused" };

  const slower = views
    .filter(
      (view) =>
        view.slowerThanUsual &&
        view.lastCheck?.responseMs != null &&
        view.typicalResponseMs != null,
    )
    .sort((a, b) => {
      const aRatio = a.lastCheck!.responseMs! / a.typicalResponseMs!;
      const bRatio = b.lastCheck!.responseMs! / b.typicalResponseMs!;
      return bRatio - aRatio;
    })[0];
  if (slower) {
    return {
      kind: "slower",
      name: slower.name,
      responseMs: slower.lastCheck!.responseMs!,
      typicalMs: slower.typicalResponseMs!,
    };
  }

  const isolated = [...views].sort(
    (a, b) => b.isolatedFailedChecks7d - a.isolatedFailedChecks7d,
  )[0];
  if (isolated && isolated.isolatedFailedChecks7d > 0) {
    return {
      kind: "isolated_fails",
      name: isolated.name,
      count: isolated.isolatedFailedChecks7d,
    };
  }

  const checked = views
    .filter((view) => view.lastCheck)
    .sort((a, b) => b.lastCheck!.at - a.lastCheck!.at)[0];
  if (checked?.lastCheck) {
    return { kind: "checked", name: checked.name, at: checked.lastCheck.at };
  }

  return { kind: "up" };
}

export function calendarFor(
  db: AppDatabase,
  monitorId: string,
  now: number,
): CalendarDay[] {
  const today = utcDayStart(now);
  const first = today - (CALENDAR_DAYS - 1) * DAY_MS;
  const segments = db
    .select()
    .from(stateSegments)
    .where(eq(stateSegments.monitorId, monitorId))
    .all();

  const days: CalendarDay[] = [];
  for (let i = 0; i < CALENDAR_DAYS; i += 1) {
    const start = first + i * DAY_MS;
    const end = Math.min(start + DAY_MS, now);
    const seen = new Set<MonitorState>();
    for (const segment of segments) {
      const segStart = toMs(segment.startedAt);
      const segEnd = segment.endedAt ? toMs(segment.endedAt) : now;
      const overlap = Math.min(segEnd, end) - Math.max(segStart, start);
      if (overlap > 0) seen.add(segment.state as MonitorState);
    }
    days.push({ at: start, kind: classifyCalendarDay(seen) });
  }
  return days;
}

export function listRecentChecks(
  db: AppDatabase,
  id: string,
  limit = RECENT_CHECK_LIMIT,
): RecordedCheck[] {
  loadMonitorRow(db, id);
  return db
    .select()
    .from(checks)
    .where(eq(checks.monitorId, id))
    .orderBy(desc(checks.at))
    .limit(limit)
    .all()
    .map((row) => ({
      id: row.id,
      at: toMs(row.at),
      success: row.success,
      statusCode: row.statusCode,
      responseMs: row.responseMs,
      error: row.error,
    }));
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
  const lastCheck = lastCheckFor(db, monitor.id);
  const typicalResponseMs = typicalResponseFor(db, monitor.id, now);
  return {
    id: monitor.id,
    name: monitor.name,
    url: monitor.url,
    public: monitor.public,
    paused: monitor.paused,
    state: monitor.state,
    availability90d: availabilityFor(db, monitor.id, windowStart, now),
    series: seriesFor(db, monitor.id, windowStart),
    incidents: incidentsFor(db, monitor.id),
    calendar: calendarFor(db, monitor.id, now),
    lastCheck,
    typicalResponseMs,
    slowerThanUsual: isSlowerThanUsual(lastCheck, typicalResponseMs),
    isolatedFailedChecks7d: isolatedFailedChecksFor(db, monitor.id, now),
    upSince: upSinceFor(db, monitor),
  };
}

function lastCheckFor(db: AppDatabase, monitorId: string): LastCheck | null {
  const row = db
    .select()
    .from(checks)
    .where(eq(checks.monitorId, monitorId))
    .orderBy(desc(checks.at))
    .limit(1)
    .get();
  if (!row) return null;
  return {
    at: toMs(row.at),
    success: row.success,
    statusCode: row.statusCode,
    responseMs: row.responseMs,
    error: row.error,
  };
}

function upSinceFor(db: AppDatabase, monitor: Monitor): number | null {
  if (monitor.state !== "Up") return null;
  const open = db
    .select()
    .from(stateSegments)
    .where(
      and(eq(stateSegments.monitorId, monitor.id), isNull(stateSegments.endedAt)),
    )
    .get();
  if (!open || open.state !== "Up") return null;
  return toMs(open.startedAt);
}

function typicalResponseFor(
  db: AppDatabase,
  monitorId: string,
  now: number,
): number | null {
  const samples = db
    .select({ responseMs: checks.responseMs })
    .from(checks)
    .where(
      and(
        eq(checks.monitorId, monitorId),
        eq(checks.success, true),
        gte(checks.at, new Date(now - SEVEN_DAYS_MS)),
        lte(checks.at, new Date(now)),
      ),
    )
    .all()
    .map((row) => row.responseMs)
    .filter((value): value is number => value != null);

  return median(samples);
}

function isSlowerThanUsual(
  lastCheck: LastCheck | null,
  typicalResponseMs: number | null,
): boolean {
  if (
    lastCheck == null ||
    !lastCheck.success ||
    lastCheck.responseMs == null ||
    typicalResponseMs == null
  ) {
    return false;
  }
  return (
    lastCheck.responseMs > typicalResponseMs * SLOWER_RATIO &&
    lastCheck.responseMs - typicalResponseMs >= SLOWER_MIN_DELTA_MS
  );
}

function isolatedFailedChecksFor(
  db: AppDatabase,
  monitorId: string,
  now: number,
): number {
  const rows = db
    .select({ success: checks.success })
    .from(checks)
    .where(
      and(
        eq(checks.monitorId, monitorId),
        gte(checks.at, new Date(now - SEVEN_DAYS_MS)),
        lte(checks.at, new Date(now)),
      ),
    )
    .orderBy(asc(checks.at))
    .all();

  let isolated = 0;
  let streak = 0;
  const flush = () => {
    if (streak > 0 && streak < 3) isolated += streak;
    streak = 0;
  };
  for (const row of rows) {
    if (row.success) flush();
    else streak += 1;
  }
  flush();
  return isolated;
}

function median(values: number[]): number | null {
  if (values.length < TYPICAL_MIN_SAMPLES) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const left = sorted[mid - 1];
  const right = sorted[mid];
  if (left == null || right == null) return null;
  return Math.round((left + right) / 2);
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

function utcDayStart(ms: number): number {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function classifyCalendarDay(seen: Set<MonitorState>): CalendarDayKind {
  if (seen.size === 0) return "none";
  if (seen.size > 1) return "mixed";
  if (seen.has("Up")) return "up";
  if (seen.has("Down")) return "down";
  return "paused";
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
