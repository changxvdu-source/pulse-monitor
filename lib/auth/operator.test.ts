import { describe, expect, it } from "vitest";

describe("ensureOperator", () => {
  it("creates the Operator from email and password when none exists", async () => {
    const { createTestDb } = await import("./test-db");
    const { ensureOperator, findOperatorByEmail } = await import("./operator");
    const db = createTestDb();

    await ensureOperator(db, {
      email: "ops@example.com",
      password: "secret-pass",
    });

    const operator = findOperatorByEmail(db, "ops@example.com");
    expect(operator).not.toBeNull();
    expect(operator?.email).toBe("ops@example.com");
  });

  it("does not create a second Operator when one already exists", async () => {
    const { createTestDb } = await import("./test-db");
    const { ensureOperator, listOperators } = await import("./operator");
    const db = createTestDb();

    await ensureOperator(db, {
      email: "ops@example.com",
      password: "secret-pass",
    });
    await ensureOperator(db, {
      email: "other@example.com",
      password: "other-pass",
    });

    expect(listOperators(db)).toHaveLength(1);
    expect(listOperators(db)[0]?.email).toBe("ops@example.com");
  });
});

describe("authenticate", () => {
  it("returns the Operator for a matching email and password", async () => {
    const { createTestDb } = await import("./test-db");
    const { ensureOperator, authenticate } = await import("./operator");
    const db = createTestDb();

    await ensureOperator(db, {
      email: "ops@example.com",
      password: "secret-pass",
    });

    const result = await authenticate(db, {
      email: "ops@example.com",
      password: "secret-pass",
    });

    expect(result?.email).toBe("ops@example.com");
  });

  it("returns null for a wrong password", async () => {
    const { createTestDb } = await import("./test-db");
    const { ensureOperator, authenticate } = await import("./operator");
    const db = createTestDb();

    await ensureOperator(db, {
      email: "ops@example.com",
      password: "secret-pass",
    });

    const result = await authenticate(db, {
      email: "ops@example.com",
      password: "wrong",
    });

    expect(result).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    const { createTestDb } = await import("./test-db");
    const { ensureOperator, authenticate } = await import("./operator");
    const db = createTestDb();

    await ensureOperator(db, {
      email: "ops@example.com",
      password: "secret-pass",
    });

    const result = await authenticate(db, {
      email: "nobody@example.com",
      password: "secret-pass",
    });

    expect(result).toBeNull();
  });
});
