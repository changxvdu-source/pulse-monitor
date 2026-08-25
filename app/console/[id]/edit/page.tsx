import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditMonitorForm } from "@/app/components/monitor-form";
import { paperCard, paperTextLink } from "@/app/components/paper";
import { PageShell } from "@/app/components/page-shell";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { formatUtc } from "@/lib/i18n/messages";
import { getDictionary } from "@/lib/i18n/server";
import { getMonitor } from "@/lib/monitoring/monitoring";

export default async function EditMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const operator = await getCurrentOperator();
  if (!operator) redirect("/login");

  const { id } = await params;
  let monitor;
  try {
    monitor = getMonitor(getDb(), id);
  } catch {
    notFound();
  }

  const { locale, t } = await getDictionary();
  const now = formatUtc(new Date(), locale);

  return (
    <PageShell
      title={t.editMonitor}
      subtitle={monitor.name}
      locale={locale}
      t={t}
      now={now}
      actions={
        <Link
          href={`/console/${monitor.id}`}
          className={paperTextLink}
        >
          {t.backToConsole}
        </Link>
      }
    >
      <section className={`${paperCard} px-5 py-5`}>
        <EditMonitorForm
          monitor={monitor}
          labels={{
            name: t.monitorName,
            url: t.monitorUrl,
            notificationEmail: t.monitorNotificationEmail,
            notificationEmailHint: t.monitorNotificationEmailHint,
            public: t.monitorPublic,
            save: t.saveMonitor,
            create: t.createMonitor,
            errors: {
              name_required: t.errorNameRequired,
              invalid_url: t.errorInvalidUrl,
              invalid_email: t.errorInvalidEmail,
              url_not_unique: t.errorUrlNotUnique,
              not_found: t.errorNotFound,
              unauthorized: t.errorUnauthorized,
            },
          }}
        />
      </section>
    </PageShell>
  );
}
