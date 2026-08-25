import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditMonitorForm } from "@/app/components/monitor-form";
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
          className="text-sm text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
        >
          {t.backToConsole}
        </Link>
      }
    >
      <section className="rounded-xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
        <EditMonitorForm
          monitor={monitor}
          labels={{
            name: t.monitorName,
            url: t.monitorUrl,
            public: t.monitorPublic,
            save: t.saveMonitor,
            create: t.createMonitor,
            errors: {
              name_required: t.errorNameRequired,
              invalid_url: t.errorInvalidUrl,
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
