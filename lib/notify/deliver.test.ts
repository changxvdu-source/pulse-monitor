import { describe, expect, it } from "vitest";
import { createTestDb } from "@/lib/auth/test-db";
import { createMonitor, pauseMonitor, recordCheck } from "@/lib/monitoring/monitoring";
import { createRecordingMailer } from "./mailer";
import { deliverIntents } from "./deliver";

const FIVE = 5 * 60 * 1000;
const ORIGIN = Date.UTC(2026, 0, 1, 0, 0, 0);

describe("deliverIntents", () => {
  it("sends mail to the Operator address when an Incident opens", async () => {
    const db = createTestDb();
    let t = ORIGIN;
    const id = createMonitor(
      db,
      { name: "Docs", url: "https://example.com/health", public: true },
      t,
    ).monitor.id;

    let last = null as ReturnType<typeof recordCheck> | null;
    for (let i = 0; i < 3; i += 1) {
      t += FIVE;
      last = recordCheck(db, id, { at: t, error: "timeout" });
    }

    const mailer = createRecordingMailer();
    await deliverIntents(db, last!.intents, mailer, {
      to: "ops@example.com",
      locale: "en",
    });

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.to).toBe("ops@example.com");
    expect(mailer.sent[0]?.subject).toBe("[Pulse] Docs is Down");
  });

  it("sends mail when Pause closes an Incident", async () => {
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
    const mailer = createRecordingMailer();
    await deliverIntents(db, paused.intents, mailer, {
      to: "ops@example.com",
      locale: "en",
    });
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.text).toContain("paused");
  });
});
