import { describe, expect, it } from "vitest";

describe("session token", () => {
  it("round-trips an Operator id", async () => {
    const { createSessionToken, verifySessionToken } = await import("./session");
    const secret = "test-session-secret-at-least-32-chars";
    const token = createSessionToken({ operatorId: "op_1", secret });
    expect(verifySessionToken({ token, secret })).toEqual({ operatorId: "op_1" });
  });

  it("rejects a tampered token", async () => {
    const { createSessionToken, verifySessionToken } = await import("./session");
    const secret = "test-session-secret-at-least-32-chars";
    const token = createSessionToken({ operatorId: "op_1", secret });
    const tampered = `${token.slice(0, -2)}xx`;
    expect(verifySessionToken({ token: tampered, secret })).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const { createSessionToken, verifySessionToken } = await import("./session");
    const token = createSessionToken({
      operatorId: "op_1",
      secret: "test-session-secret-at-least-32-chars",
    });
    expect(
      verifySessionToken({
        token,
        secret: "other-session-secret-at-least-32-ch",
      }),
    ).toBeNull();
  });
});
