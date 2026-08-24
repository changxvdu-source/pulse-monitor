import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db/client";
import { operators, type OperatorRow } from "@/lib/db/schema";
import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
} from "@/lib/i18n/messages";

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
      locale: DEFAULT_LOCALE,
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

export function getOperatorLocale(db: AppDatabase): Locale {
  const row = db.select({ locale: operators.locale }).from(operators).get();
  return isLocale(row?.locale) ? row.locale : DEFAULT_LOCALE;
}

export function setOperatorLocale(db: AppDatabase, locale: Locale): void {
  const row = db.select({ id: operators.id }).from(operators).get();
  if (!row) return;
  db.update(operators)
    .set({ locale })
    .where(eq(operators.id, row.id))
    .run();
}
