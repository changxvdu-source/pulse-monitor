import { describe, expect, it } from "vitest";
import { composeNotification } from "./compose";

describe("composeNotification", () => {
  it("says which Monitor went Down in English by default", () => {
    const mail = composeNotification(
      {
        kind: "incident_opened",
        monitorName: "Docs",
        openedAt: Date.UTC(2026, 0, 1, 0, 15, 0),
      },
      "en",
    );
    expect(mail.subject).toBe("[Pulse] Docs is Down");
    expect(mail.text).toContain("Docs");
    expect(mail.text).toContain("Down");
    expect(mail.text).toContain("2026-01-01T00:15:00Z UTC");
  });

  it("includes duration when an Incident closes", () => {
    const mail = composeNotification(
      {
        kind: "incident_closed",
        reason: "recovered",
        monitorName: "Docs",
        openedAt: Date.UTC(2026, 0, 1, 0, 15, 0),
        closedAt: Date.UTC(2026, 0, 1, 0, 30, 0),
      },
      "en",
    );
    expect(mail.subject).toBe("[Pulse] Docs is Up");
    expect(mail.text).toContain("15 minutes");
  });

  it("uses Chinese copy when the Operator last chose zh", () => {
    const mail = composeNotification(
      {
        kind: "incident_opened",
        monitorName: "Docs",
        openedAt: Date.UTC(2026, 0, 1, 0, 15, 0),
      },
      "zh",
    );
    expect(mail.subject).toContain("Down");
    expect(mail.text).toContain("变为 Down");
  });
});
