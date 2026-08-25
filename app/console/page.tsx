import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { CreateMonitorForm } from "@/app/components/monitor-form";
import { MonitorCompareTable } from "@/app/components/monitor-compare-table";
import {
  paperCard,
  paperSecondaryButton,
  paperTextLink,
} from "@/app/components/paper";
import { PageShell } from "@/app/components/page-shell";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { formatUtc } from "@/lib/i18n/messages";
import { getDictionary } from "@/lib/i18n/server";
import { listMonitorStatusViews } from "@/lib/monitoring/monitoring";
import Link from "next/link";

export default async function ConsolePage() {
  const operator = await getCurrentOperator();
  if (!operator) redirect("/login");

  const { locale, t } = await getDictionary();
  const at = new Date();
  const nowMs = at.getTime();
  const now = formatUtc(at, locale);
  const monitors = listMonitorStatusViews(getDb(), nowMs);

  const formLabels = {
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
  };

  return (
    <PageShell
      title={t.consoleTitle}
      subtitle={operator.email}
      locale={locale}
      t={t}
      now={now}
      actions={
        <>
          <form action={signOut}>
            <button type="submit" className={paperSecondaryButton}>
              {t.signOut}
            </button>
          </form>
          <Link href="/" className={paperTextLink}>
            {t.viewStatusPage}
          </Link>
        </>
      }
    >
      <details className={`${paperCard} px-5 py-4`} open={monitors.length === 0}>
        <summary className="cursor-pointer text-lg font-medium">
          {t.createMonitor}
        </summary>
        <div className="mt-4">
          <CreateMonitorForm labels={formLabels} />
        </div>
      </details>

      {monitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white/70 px-6 py-10">
          <p className="text-lg font-medium">{t.consoleEmpty}</p>
          <p className="mt-2 text-zinc-600">{t.consoleHint}</p>
        </div>
      ) : (
        <MonitorCompareTable
          views={monitors}
          now={nowMs}
          locale={locale}
          t={t}
          heading={t.monitorsHeading}
          monitorHref={(id) => `/console/${id}`}
          operator
        />
      )}
    </PageShell>
  );
}
