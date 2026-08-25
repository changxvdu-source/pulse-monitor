import { describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/auth/test-db";
import {
  calendarFor,
  createMonitor,
  deleteMonitor,
  getMonitor,
  getMonitorStatusView,
  getStatusPage,
  listMonitors,
  listPublicMonitors,
  listRecentChecks,
  listRunnableMonitors,
  overallStatus,
  pauseMonitor,
  recordCheck,
  resumeMonitor,
  rotateChecks,
  updateMonitor,
} from "./monitoring";

const FIVE = 5 * 60 * 1000;
const ORIGIN = Date.UTC(2026, 0, 1, 0, 0, 0);

describe("createMonitor", () => {
  it("creates a Monitor with name, url, and public flag", () => {
    const db = createTestDb();
    const result = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    );

    expect(result.monitor.name).toBe("Docs");
    expect(result.monitor.url).toBe("https://example.com/health");
    expect(result.monitor.public).toBe(true);
    expect(result.monitor.state).toBe("Up");
    expect(listMonitors(db)).toHaveLength(1);
  });

  it("rejects an empty name", () => {
    const db = createTestDb();
    expect(() =>
      createMonitor(db, { name: "  ", url: "https://example.com", public: false }, ORIGIN),
    ).toThrow("name_required");
  });

  it("rejects a non-http(s) URL", () => {
    const db = createTestDb();
    expect(() =>
      createMonitor(db, { name: "FTP", url: "ftp://example.com", public: false }, ORIGIN),
    ).toThrow("invalid_url");
  });

  it("rejects a duplicate URL", () => {
    const db = createTestDb();
    createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    );
    expect(() =>
      createMonitor(
        db,
        { name: "Copy", url: "https://example.com/health", public: false },
        ORIGIN,
      ),
    ).toThrow("url_not_unique");
  });

  it("accepts http URLs", () => {
    const db = createTestDb();
    const result = createMonitor(
      db,
      { name: "Local", url: "http://127.0.0.1:3000/health", public: false },
      ORIGIN,
    );
    expect(result.monitor.url).toBe("http://127.0.0.1:3000/health");
  });
});

describe("updateMonitor", () => {
  it("updates name, url, and public flag", () => {
    const db = createTestDb();
    const created = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    );

    const updated = updateMonitor(db, created.monitor.id, {
      name: "API",
      url: "https://example.com/api",
      public: false,
    });

    expect(updated.monitor.name).toBe("API");
    expect(updated.monitor.url).toBe("https://example.com/api");
    expect(updated.monitor.public).toBe(false);
  });

  it("rejects changing to another Monitor's URL", () => {
    const db = createTestDb();
    createMonitor(
      db,
      { name: "One", url: "https://one.example.com", public: true },
      ORIGIN,
    );
    const two = createMonitor(
      db,
      { name: "Two", url: "https://two.example.com", public: true },
      ORIGIN,
    );

    expect(() =>
      updateMonitor(db, two.monitor.id, {
        name: "Two",
        url: "https://one.example.com",
        public: true,
      }),
    ).toThrow("url_not_unique");
  });

  it("allows keeping the same URL on update", () => {
    const db = createTestDb();
    const created = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    );

    const updated = updateMonitor(db, created.monitor.id, {
      name: "Docs renamed",
      url: "https://example.com/health",
      public: true,
    });

    expect(updated.monitor.name).toBe("Docs renamed");
  });
});

describe("deleteMonitor", () => {
  it("removes a Monitor", () => {
    const db = createTestDb();
    const created = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    );

    deleteMonitor(db, created.monitor.id);
    expect(listMonitors(db)).toHaveLength(0);
    expect(() => getMonitor(db, created.monitor.id)).toThrow("not_found");
  });
});

describe("recordCheck and Incidents", () => {
  it("opens an Incident after three consecutive Failed Checks", () => {
    const db = createTestDb();
    let t = ORIGIN;
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      t,
    ).monitor.id;

    t += FIVE;
    let r = recordCheck(db, id, { at: t, error: "timeout" });
    expect(r.monitor.state).toBe("Up");
    expect(r.intents).toHaveLength(0);

    t += FIVE;
    r = recordCheck(db, id, { at: t, error: "timeout" });
    expect(r.monitor.state).toBe("Up");

    t += FIVE;
    r = recordCheck(db, id, { at: t, error: "timeout" });
    expect(r.monitor.state).toBe("Down");
    expect(r.intents[0]?.kind).toBe("incident_opened");
  });

  it("resets consecutive fails after a Successful Check", () => {
    const db = createTestDb();
    let t = ORIGIN;
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      t,
    ).monitor.id;

    for (const payload of [
      { error: "timeout" },
      { error: "timeout" },
      { statusCode: 200, responseMs: 10 },
      { error: "timeout" },
      { error: "timeout" },
    ] as const) {
      t += FIVE;
      const r = recordCheck(db, id, { at: t, ...payload });
      expect(r.monitor.state).toBe("Up");
      expect(r.intents).toHaveLength(0);
    }
  });

  it("closes an Incident after three consecutive Successful Checks", () => {
    const db = createTestDb();
    let t = ORIGIN;
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      t,
    ).monitor.id;

    for (let i = 0; i < 3; i += 1) {
      t += FIVE;
      recordCheck(db, id, { at: t, error: "timeout" });
    }

    t += FIVE;
    let r = recordCheck(db, id, { at: t, statusCode: 200, responseMs: 1 });
    expect(r.monitor.state).toBe("Down");

    t += FIVE;
    r = recordCheck(db, id, { at: t, statusCode: 200, responseMs: 1 });
    expect(r.monitor.state).toBe("Down");

    t += FIVE;
    r = recordCheck(db, id, { at: t, statusCode: 200, responseMs: 1 });
    expect(r.monitor.state).toBe("Up");
    expect(r.intents[0]?.kind).toBe("incident_closed");
    expect(r.intents[0]).toMatchObject({ reason: "recovered" });
  });

  it("treats 301 as Successful Check and 500 as Failed Check", () => {
    const db = createTestDb();
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    ).monitor.id;

    const ok = recordCheck(db, id, {
      at: ORIGIN + FIVE,
      statusCode: 301,
      responseMs: 5,
    });
    expect(ok.check.success).toBe(true);

    const bad = recordCheck(db, id, {
      at: ORIGIN + 2 * FIVE,
      statusCode: 500,
      responseMs: 5,
    });
    expect(bad.check.success).toBe(false);
  });
});

describe("pauseMonitor and resumeMonitor", () => {
  it("closes an open Incident on Pause and rejects later Checks", () => {
    const db = createTestDb();
    let t = ORIGIN;
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      t,
    ).monitor.id;

    for (let i = 0; i < 3; i += 1) {
      t += FIVE;
      recordCheck(db, id, { at: t, error: "timeout" });
    }

    const paused = pauseMonitor(db, id, t);
    expect(paused.monitor.state).toBe("Paused");
    expect(paused.intents[0]).toMatchObject({ reason: "paused" });
    expect(() =>
      recordCheck(db, id, { at: t + FIVE, error: "timeout" }),
    ).toThrow("paused");
    expect(listRunnableMonitors(db).map((m) => m.id)).not.toContain(id);
  });

  it("resumes as Up and only counts new Checks toward Incidents", () => {
    const db = createTestDb();
    let t = ORIGIN;
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      t,
    ).monitor.id;

    for (let i = 0; i < 3; i += 1) {
      t += FIVE;
      recordCheck(db, id, { at: t, error: "timeout" });
    }
    pauseMonitor(db, id, t);
    t += FIVE;
    const resumed = resumeMonitor(db, id, t);
    expect(resumed.monitor.state).toBe("Up");

    t += FIVE;
    let r = recordCheck(db, id, { at: t, error: "timeout" });
    expect(r.monitor.state).toBe("Up");
    t += FIVE;
    r = recordCheck(db, id, { at: t, error: "timeout" });
    expect(r.monitor.state).toBe("Up");
  });
});

describe("listPublicMonitors", () => {
  it("hides private Monitors and uses the name as title", () => {
    const db = createTestDb();
    createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    );
    createMonitor(
      db,
      { name: "Internal", url: "http://127.0.0.1:3000/health", public: false },
      ORIGIN,
    );
    const pub = listPublicMonitors(db);
    expect(pub).toHaveLength(1);
    expect(pub[0]?.name).toBe("Docs");
  });
});

describe("Availability and rotation", () => {
  it("excludes Paused time from 90-day Availability", () => {
    const db = createTestDb();
    let t = ORIGIN;
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      t,
    ).monitor.id;
    for (let i = 0; i < 3; i += 1) {
      t += FIVE;
      recordCheck(db, id, { at: t, error: "timeout" });
    }
    pauseMonitor(db, id, ORIGIN + 60 * 60 * 1000);
    const resumeAt = ORIGIN + 2 * 60 * 60 * 1000;
    resumeMonitor(db, id, resumeAt);

    const view = getStatusPage(db, resumeAt)[0];
    const expected = (15 * 60 * 1000) / ((15 + 45) * 60 * 1000);
    expect(view?.availability90d).toBeCloseTo(expected, 9);
  });

  it("turns Checks older than thirty days into Hourly Summaries", () => {
    const db = createTestDb();
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    ).monitor.id;
    recordCheck(db, id, {
      at: ORIGIN + FIVE,
      statusCode: 200,
      responseMs: 100,
    });
    const later = ORIGIN + 31 * 24 * 60 * 60 * 1000;
    rotateChecks(db, later);
    const view = getStatusPage(db, later)[0];
    expect(view?.series).toEqual([
      expect.objectContaining({ responseMs: 100 }),
    ]);
  });

  it("does not rewrite Checks after Pause and Resume", () => {
    const db = createTestDb();
    let t = ORIGIN;
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      t,
    ).monitor.id;
    t += FIVE;
    recordCheck(db, id, { at: t, statusCode: 200, responseMs: 42 });
    pauseMonitor(db, id, t + FIVE);
    resumeMonitor(db, id, t + 2 * FIVE);
    const view = getStatusPage(db, t + 2 * FIVE)[0];
    expect(view?.series).toEqual(
      expect.arrayContaining([expect.objectContaining({ responseMs: 42 })]),
    );
  });
});

const DAY = 24 * 60 * 60 * 1000;

function dayKind(
  days: { at: number; kind: string }[],
  at: number,
): string | undefined {
  return days.find((day) => day.at === at)?.kind;
}

describe("getMonitorStatusView", () => {
  it("returns a Status view for a private Monitor", () => {
    const db = createTestDb();
    const id = createMonitor(
      db,
      { name: "Internal", url: "http://127.0.0.1:3000/health", public: false },
      ORIGIN,
    ).monitor.id;

    const view = getMonitorStatusView(db, id, ORIGIN);
    expect(view.name).toBe("Internal");
    expect(view.state).toBe("Up");
    expect(getStatusPage(db, ORIGIN)).toHaveLength(0);
  });
});

describe("overallStatus", () => {
  it("summarizes Monitor states for the Status Page banner", () => {
    expect(overallStatus([])).toBe("empty");
    expect(overallStatus([{ state: "Up" }, { state: "Up" }])).toBe("up");
    expect(overallStatus([{ state: "Up" }, { state: "Down" }])).toBe("down");
    expect(overallStatus([{ state: "Paused" }, { state: "Paused" }])).toBe(
      "paused",
    );
    expect(overallStatus([{ state: "Up" }, { state: "Paused" }])).toBe("up");
  });
});

describe("calendarFor", () => {
  it("marks days before the Monitor exists as none and today as Up", () => {
    const db = createTestDb();
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    ).monitor.id;

    const days = calendarFor(db, id, ORIGIN + 12 * 60 * 60 * 1000);
    expect(days).toHaveLength(90);
    expect(dayKind(days, ORIGIN)).toBe("up");
    expect(dayKind(days, ORIGIN - DAY)).toBe("none");
  });

  it("classifies a UTC day with Up and Down as mixed, and a full Paused day as paused", () => {
    const db = createTestDb();
    let t = ORIGIN;
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      t,
    ).monitor.id;

    for (let i = 0; i < 3; i += 1) {
      t += FIVE;
      recordCheck(db, id, { at: t, error: "timeout" });
    }

    const pauseAt = ORIGIN + DAY + 12 * 60 * 60 * 1000;
    pauseMonitor(db, id, pauseAt);
    const now = ORIGIN + 2 * DAY + 12 * 60 * 60 * 1000;
    const days = calendarFor(db, id, now);

    expect(dayKind(days, ORIGIN)).toBe("mixed");
    expect(dayKind(days, ORIGIN + DAY)).toBe("mixed");
    expect(dayKind(days, ORIGIN + 2 * DAY)).toBe("paused");
  });
});

describe("listRecentChecks", () => {
  it("returns newest Checks first and honors the limit", () => {
    const db = createTestDb();
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      ORIGIN,
    ).monitor.id;

    recordCheck(db, id, {
      at: ORIGIN + FIVE,
      statusCode: 200,
      responseMs: 10,
    });
    recordCheck(db, id, {
      at: ORIGIN + 2 * FIVE,
      error: "timeout",
    });

    const recent = listRecentChecks(db, id, 1);
    expect(recent).toHaveLength(1);
    expect(recent[0]?.success).toBe(false);
    expect(recent[0]?.error).toBe("timeout");

    const all = listRecentChecks(db, id, 10);
    expect(all).toHaveLength(2);
    expect(all[1]?.statusCode).toBe(200);
    expect(all[1]?.responseMs).toBe(10);
  });
});
