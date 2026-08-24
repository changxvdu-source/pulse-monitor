import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { bootstrapOperator } from "./bootstrap";
import { requireAuthEnv } from "./env";
import { verifySessionToken } from "./session";
import { getDb } from "@/lib/db";
import { operators } from "@/lib/db/schema";
import type { Operator } from "./operator";

export const SESSION_COOKIE = "pulse_session";

export async function getCurrentOperator(): Promise<Operator | null> {
  await bootstrapOperator();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { sessionSecret } = requireAuthEnv();
  const payload = verifySessionToken({ token, secret: sessionSecret });
  if (!payload) return null;

  const row = getDb()
    .select({ id: operators.id, email: operators.email })
    .from(operators)
    .where(eq(operators.id, payload.operatorId))
    .get();

  return row ?? null;
}
