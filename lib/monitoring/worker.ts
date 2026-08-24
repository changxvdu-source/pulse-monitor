import { getDb } from "@/lib/db";
import { performHttpCheck } from "@/lib/monitoring/http-check";
import {
  listRunnableMonitors,
  recordCheck,
  type NotificationIntent,
} from "@/lib/monitoring/monitoring";

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
    }
    checked += 1;
  }

  return checked;
}

export function startWorkerLoop() {
  console.log(`[pulse-worker] starting; interval=${CHECK_INTERVAL_MS}ms`);

  const tick = async () => {
    try {
      const count = await runCheckCycle({
        onIntents: (intents) => {
          for (const intent of intents) {
            console.log("[pulse-worker] notification intent", intent);
          }
        },
      });
      console.log(`[pulse-worker] checked ${count} monitor(s)`);
    } catch (error) {
      console.error("[pulse-worker] cycle failed", error);
    }
  };

  void tick();
  return setInterval(() => {
    void tick();
  }, CHECK_INTERVAL_MS);
}
