import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db/client";
import { monitors } from "@/lib/db/schema";

export type Monitor = {
  id: string;
  name: string;
  url: string;
  public: boolean;
  paused: boolean;
};

export type MonitorInput = {
  name: string;
  url: string;
  public: boolean;
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
  const existing = getMonitor(db, id);
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
  getMonitor(db, id);
  db.delete(monitors).where(eq(monitors.id, id)).run();
}

export function listMonitors(db: AppDatabase): Monitor[] {
  return db
    .select({
      id: monitors.id,
      name: monitors.name,
      url: monitors.url,
      public: monitors.public,
      paused: monitors.paused,
    })
    .from(monitors)
    .all()
    .map(toMonitor);
}

export function getMonitor(db: AppDatabase, id: string): Monitor {
  const row = db
    .select({
      id: monitors.id,
      name: monitors.name,
      url: monitors.url,
      public: monitors.public,
      paused: monitors.paused,
    })
    .from(monitors)
    .where(eq(monitors.id, id))
    .get();

  if (!row) throw new Error("not_found");
  return toMonitor(row);
}

function toMonitor(row: {
  id: string;
  name: string;
  url: string;
  public: boolean;
  paused: boolean;
}): Monitor {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    public: row.public,
    paused: row.paused,
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
