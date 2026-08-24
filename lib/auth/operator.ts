import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db/client";
import { operators, type OperatorRow } from "@/lib/db/schema";

export type Operator = {
  id: string;
  email: string;
};

export async function ensureOperator(
  db: AppDatabase,
  input: { email: string; password: string },
): Promise<Operator> {
  const existing = listOperators(db);
  if (existing.length > 0) {
    return existing[0]!;
  }

  const passwordHash = await hash(input.password, 10);
  const id = randomUUID();
  db.insert(operators)
    .values({
      id,
      email: input.email,
      passwordHash,
      createdAt: new Date(),
    })
    .run();

  return { id, email: input.email };
}

export async function authenticate(
  db: AppDatabase,
  input: { email: string; password: string },
): Promise<Operator | null> {
  const row = findOperatorByEmail(db, input.email);
  if (!row) return null;
  const ok = await compare(input.password, row.passwordHash);
  if (!ok) return null;
  return { id: row.id, email: row.email };
}

export function findOperatorByEmail(
  db: AppDatabase,
  email: string,
): OperatorRow | null {
  return (
    db.select().from(operators).where(eq(operators.email, email)).get() ?? null
  );
}

export function listOperators(db: AppDatabase): Operator[] {
  return db
    .select({ id: operators.id, email: operators.email })
    .from(operators)
    .all();
}
