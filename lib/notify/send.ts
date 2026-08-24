import { requireAuthEnv } from "@/lib/auth/env";
import { getOperatorLocale } from "@/lib/auth/operator";
import type { AppDatabase } from "@/lib/db/client";
import type { NotificationIntent } from "@/lib/monitoring/monitoring";
import { deliverIntents } from "./deliver";
import { createConfiguredMailer } from "./mailer";

export async function sendIntents(
  db: AppDatabase,
  intents: NotificationIntent[],
): Promise<void> {
  if (intents.length === 0) return;
  const { email } = requireAuthEnv();
  const locale = getOperatorLocale(db);
  await deliverIntents(db, intents, createConfiguredMailer(), {
    to: email,
    locale,
  });
}
