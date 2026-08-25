import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  formatAge,
  formatHighlight,
  formatLastCheckLine,
  formatUpSince,
  formatUtc,
  getMessages,
} from "./messages";

describe("i18n", () => {
  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(getMessages("en").signIn).toBe("Sign in");
  });

  it("labels timestamps with UTC", () => {
    const stamped = formatUtc(new Date("2026-01-01T00:00:00.000Z"), "en");
    expect(stamped).toBe("2026-01-01T00:00:00Z UTC");
  });

  it("switches Chinese copy", () => {
    expect(getMessages("zh").signIn).toBe("登录");
    expect(getMessages("zh").overallDown).toBe("有公开 Monitor 处于 Down");
    expect(getMessages("zh").loginThrottled).toBe(
      "登录尝试过多，请 15 分钟后再试。",
    );
    expect(getMessages("zh").isolatedFails7d).toBe("近 7 天孤立 Failed Check");
    expect(getMessages("zh").slowerThanUsual).toBe("偏慢");
    expect(getMessages("zh").upSince).toBe("Up Since");
    expect(getMessages("zh").monitorNotificationEmail).toBe("Notification 地址");
  });

  it("formats Last Check evidence", () => {
    expect(formatAge(20_000, "en")).toBe("Just now");
    expect(formatAge(3 * 60_000, "en")).toBe("3 minutes ago");
    expect(formatAge(3 * 60_000, "zh")).toBe("3 分钟前");
    expect(
      formatLastCheckLine(
        {
          at: Date.parse("2026-01-01T00:00:00Z"),
          success: true,
          statusCode: 200,
          responseMs: 187,
          error: null,
        },
        Date.parse("2026-01-01T00:02:00Z"),
        "en",
      ),
    ).toBe("2 minutes ago · HTTP 200 · 187 ms");
  });

  it("formats Up Since as an elapsed duration", () => {
    const origin = Date.parse("2026-01-01T00:00:00Z");
    expect(formatUpSince(null, origin, "en")).toBeNull();
    expect(formatUpSince(origin, origin + 20_000, "en")).toBe("Just now");
    expect(formatUpSince(origin, origin + 3 * 60_000, "en")).toBe("3 minutes");
    expect(formatUpSince(origin, origin + 3 * 60_000, "zh")).toBe("3 分钟");
    expect(formatUpSince(origin, origin + 2 * 60 * 60_000, "en")).toBe("2 hours");
    expect(formatUpSince(origin, origin + 14 * 24 * 60 * 60_000, "en")).toBe(
      "14 days",
    );
    expect(formatUpSince(origin, origin + 14 * 24 * 60 * 60_000, "zh")).toBe(
      "14 天",
    );
  });

  it("formats a Status Page highlight in both languages", () => {
    expect(
      formatHighlight(
        { kind: "slower", name: "Docs", responseMs: 400, typicalMs: 180 },
        "en",
      ),
    ).toBe("Docs is slower than usual: 400 ms vs typical 180 ms");
    expect(
      formatHighlight({ kind: "isolated_fails", name: "API", count: 2 }, "zh"),
    ).toBe("API：近 7 天 2 次孤立 Failed Check");
  });
});
