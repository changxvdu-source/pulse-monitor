import { describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/auth/test-db";
import {
  createMonitor,
  deleteMonitor,
  getMonitor,
  listMonitors,
  updateMonitor,
} from "./monitoring";

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
