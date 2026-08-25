import { afterEach, describe, expect, it } from "vitest";
import {
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MS,
  clientIp,
  isThrottled,
  recordFailure,
  recordSuccess,
  resetLoginLimitForTests,
} from "./login-limit";

afterEach(() => {
  resetLoginLimitForTests();
});

describe("clientIp", () => {
  it("prefers the first X-Forwarded-For address", () => {
    expect(
      clientIp({
        get(name) {
          if (name === "x-forwarded-for") return "203.0.113.9, 10.0.0.1";
          return null;
        },
      }),
    ).toBe("203.0.113.9");
  });

  it("falls back to X-Real-IP then unknown", () => {
    expect(
      clientIp({
        get(name) {
          if (name === "x-real-ip") return "198.51.100.4";
          return null;
        },
      }),
    ).toBe("198.51.100.4");
    expect(clientIp({ get: () => null })).toBe("unknown");
  });
});

describe("login limit", () => {
  it("throttles after five failures in the window", () => {
    const ip = "203.0.113.9";
    const now = 1_700_000_000_000;
    for (let i = 0; i < LOGIN_MAX_FAILURES; i += 1) {
      expect(isThrottled(ip, now)).toBe(false);
      recordFailure(ip, now + i);
    }
    expect(isThrottled(ip, now + LOGIN_MAX_FAILURES)).toBe(true);
  });

  it("clears on success and expires with the window", () => {
    const ip = "203.0.113.9";
    const now = 1_700_000_000_000;
    for (let i = 0; i < LOGIN_MAX_FAILURES; i += 1) {
      recordFailure(ip, now);
    }
    recordSuccess(ip);
    expect(isThrottled(ip, now)).toBe(false);

    for (let i = 0; i < LOGIN_MAX_FAILURES; i += 1) {
      recordFailure(ip, now);
    }
    expect(isThrottled(ip, now + LOGIN_WINDOW_MS + 1)).toBe(false);
  });
});
