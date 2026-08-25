import { MonitorStatusCard } from "@/app/components/monitor-status-card";
import { OverallBanner } from "@/app/components/overall-banner";
import { PageShell } from "@/app/components/page-shell";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { formatUtc } from "@/lib/i18n/messages";
import { getDictionary } from "@/lib/i18n/server";
import { getStatusPage, overallStatus } from "@/lib/monitoring/monitoring";
import Link from "next/link";

export default async function StatusPage() {
  const operator = await getCurrentOperator();
  const { locale, t } = await getDictionary();
  const at = new Date();
  const now = formatUtc(at, locale);
  const views = getStatusPage(getDb(), at.getTime());
  const banner = overallStatus(views);

  return (
    <PageShell
      title={t.statusTitle}
      locale={locale}
      t={t}
      now={now}
      actions={
        operator ? (
          <Link
            href="/console"
            className="text-sm text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
          >
            {t.consoleTitle}
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
          >
            {t.operatorSignIn}
          </Link>
        )
      }
    >
      <OverallBanner status={banner} t={t} />
      {views.length > 0 ? (
        <div className="flex flex-col gap-5">
          {views.map((view) => (
            <MonitorStatusCard
              key={view.id}
              view={view}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}
