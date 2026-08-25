import type { AppDatabase } from "@/lib/db/client";
import type { Locale } from "@/lib/i18n/messages";
import { getMonitor, loadIncident, type NotificationIntent } from "@/lib/monitoring/monitoring";
import { composeNotification } from "./compose";
import type { Mailer } from "./mailer";

export async function deliverIntents(
  db: AppDatabase,
  intents: NotificationIntent[],
  mailer: Mailer,
  options: { to: string; locale: Locale },
): Promise<void> {
  for (const intent of intents) {
    const monitor = getMonitor(db, intent.monitorId);
    const incident = loadIncident(db, intent.incidentId);
    if (!incident) continue;

    const to = monitor.notificationEmail || options.to;

    if (intent.kind === "incident_opened") {
      const mail = composeNotification(
        {
          kind: "incident_opened",
          monitorName: monitor.name,
          openedAt: incident.openedAt,
        },
        options.locale,
      );
      await mailer.send({ to, ...mail });
      continue;
    }

    const closedAt = incident.closedAt ?? Date.now();
    const mail = composeNotification(
      {
        kind: "incident_closed",
        reason: intent.reason,
        monitorName: monitor.name,
        openedAt: incident.openedAt,
        closedAt,
      },
      options.locale,
    );
    await mailer.send({ to, ...mail });
  }
}
