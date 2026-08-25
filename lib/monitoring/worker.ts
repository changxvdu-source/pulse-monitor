import { getDb } from "@/lib/db";
import { performHttpCheck } from "@/lib/monitoring/http-check";
import {
  listRunnableMonitors,
  recordCheck,
  rotateChecks,
  type NotificationIntent,
} from "@/lib/monitoring/monitoring";
import { sendIntents } from "@/lib/notify/send";

export const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export async function runCheckCycle(options?: {
  now?: number;
  onIntents?: (intents: NotificationIntent[]) => void;
}): Promise<number> {
  const db = getDb();
  const now = options?.now ?? Date.now();
  const runnable = listRunnableMonitors(db);
  let checked = 0;

  for (const monitor of runnable) {
    const result = await performHttpCheck(monitor.url);
    const recorded = recordCheck(db, monitor.id, {
      at: now,
      statusCode: result.statusCode,
      responseMs: result.responseMs,
      error: result.error,
    });
    if (recorded.intents.length > 0) {
      options?.onIntents?.(recorded.intents);
      if (!options?.onIntents) {
        await sendIntents(db, recorded.intents);
      }
    }
    checked += 1;
  }

  rotateChecks(db, now);
  return checked;
}

/**
 * Checks are serial within a cycle, so a slow cycle can outlast the interval.
 * A dropped tick is cheaper than two cycles racing to record the same Check.
 */
export function skipWhileRunning(
  run: () => Promise<void>,
): () => Promise<void> {
  let running = false;
  return async () => {
    if (running) return;
    running = true;
    try {
      await run();
    } finally {
      running = false;
    }
  };
}

export function startWorkerLoop() {
  console.log(`[pulse-worker] starting; interval=${CHECK_INTERVAL_MS}ms`);

  const tick = skipWhileRunning(async () => {
    try {
      const count = await runCheckCycle();
      console.log(`[pulse-worker] checked ${count} monitor(s)`);
    } catch (error) {
      console.error("[pulse-worker] cycle failed", error);
    }
  });

  void tick();
  return setInterval(() => {
    void tick();
  }, CHECK_INTERVAL_MS);
}
