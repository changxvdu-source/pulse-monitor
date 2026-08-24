import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, formatUtc, getMessages } from "./messages";

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
  });
});
