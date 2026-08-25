import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  createSessionToken,
  verifySessionToken,
} from "./session";

const SECRET = "test-session-secret-at-least-32-chars";

describe("session token", () => {
  it("round-trips an Operator id", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken({ operatorId: "op_1", secret: SECRET, now });
    expect(verifySessionToken({ token, secret: SECRET, now })).toEqual({
      operatorId: "op_1",
    });
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken({ operatorId: "op_1", secret: SECRET });
    const tampered = `${token.slice(0, -2)}xx`;
    expect(verifySessionToken({ token: tampered, secret: SECRET })).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken({
      operatorId: "op_1",
      secret: SECRET,
    });
    expect(
      verifySessionToken({
        token,
        secret: "other-session-secret-at-least-32-ch",
      }),
    ).toBeNull();
  });

  it("rejects an expired token", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken({ operatorId: "op_1", secret: SECRET, now });
    const later = now + 8 * 24 * 60 * 60 * 1000;
    expect(verifySessionToken({ token, secret: SECRET, now: later })).toBeNull();
  });

  it("rejects a token with no exp", () => {
    const body = Buffer.from(JSON.stringify({ operatorId: "op_1" })).toString(
      "base64url",
    );
    const signature = createHmac("sha256", SECRET).update(body).digest("base64url");
    expect(
      verifySessionToken({ token: `${body}.${signature}`, secret: SECRET }),
    ).toBeNull();
  });
});
