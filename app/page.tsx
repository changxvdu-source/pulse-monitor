import { historyDetailsOpen } from "@/app/components/history-details-open";
import { MonitorCompareTable } from "@/app/components/monitor-compare-table";
import { MonitorStatusCard } from "@/app/components/monitor-status-card";
import { OverallBanner } from "@/app/components/overall-banner";
import { paperCard, paperTextLink } from "@/app/components/paper";
import { PageShell } from "@/app/components/page-shell";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { formatUtc } from "@/lib/i18n/messages";
import { getDictionary } from "@/lib/i18n/server";
import {
  getStatusPage,
  overallHighlight,
  overallStatus,
} from "@/lib/monitoring/monitoring";
import Link from "next/link";

export default async function StatusPage() {
  const operator = await getCurrentOperator();
  const { locale, t } = await getDictionary();
  const at = new Date();
  const nowMs = at.getTime();
  const now = formatUtc(at, locale);
  const views = getStatusPage(getDb(), nowMs);
  const banner = overallStatus(views);
  const highlight = overallHighlight(views);

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
            className={paperTextLink}
          >
            {t.consoleTitle}
          </Link>
        ) : (
          <Link
            href="/login"
            className={paperTextLink}
          >
            {t.operatorSignIn}
          </Link>
        )
      }
    >
      <OverallBanner
        status={banner}
        highlight={highlight}
        locale={locale}
        t={t}
      />
      {views.length > 0 ? (
        <>
          <MonitorCompareTable
            views={views}
            now={nowMs}
            locale={locale}
            t={t}
            heading={t.compareHeading}
            monitorHref={(id) => `#monitor-${id}`}
          />
          <div className="flex flex-col gap-3">
            {views.map((view) => (
              <details
                key={view.id}
                open={historyDetailsOpen(view)}
                className={paperCard}
              >
                <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  {view.name} · {t.historyDetails}
                </summary>
                <div className="border-t border-zinc-100">
                  <MonitorStatusCard
                    view={view}
                    now={nowMs}
                    locale={locale}
                    t={t}
                    hideIdentity
                    embedded
                    historyOnly
                  />
                </div>
              </details>
            ))}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
