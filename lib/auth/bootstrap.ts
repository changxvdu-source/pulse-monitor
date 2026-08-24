import { ensureOperator } from "./operator";
import { requireAuthEnv } from "./env";
import { getDb } from "@/lib/db";

export async function bootstrapOperator() {
  const { email, password } = requireAuthEnv();
  return ensureOperator(getDb(), { email, password });
}
