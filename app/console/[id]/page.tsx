import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  deleteMonitorAction,
  pauseMonitorAction,
  resumeMonitorAction,
} from "@/app/monitor-actions";
import { MonitorStatusCard } from "@/app/components/monitor-status-card";
import {
  paperCard,
  paperDangerButton,
  paperSecondaryButton,
  paperTextLink,
} from "@/app/components/paper";
import { PageShell } from "@/app/components/page-shell";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { formatUtc } from "@/lib/i18n/messages";
import { getDictionary } from "@/lib/i18n/server";
import {
  getMonitorStatusView,
  listRecentChecks,
} from "@/lib/monitoring/monitoring";

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const operator = await getCurrentOperator();
  if (!operator) redirect("/login");

  const { id } = await params;
  const at = new Date();
  const db = getDb();
  let view;
  try {
    view = getMonitorStatusView(db, id, at.getTime());
  } catch {
    notFound();
  }
  const checks = listRecentChecks(db, id);
  const { locale, t } = await getDictionary();
  const stamped = formatUtc(at, locale);

  return (
    <PageShell
      title={view.name}
      subtitle={view.url}
      locale={locale}
      t={t}
      now={stamped}
      actions={
        <Link
          href="/console"
          className={paperTextLink}
        >
          {t.backToConsole}
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        {view.paused ? (
          <form action={resumeMonitorAction}>
            <input type="hidden" name="id" value={view.id} />
            <button
              type="submit"
              className={paperSecondaryButton}
            >
              {t.resumeMonitor}
            </button>
          </form>
        ) : (
          <form action={pauseMonitorAction}>
            <input type="hidden" name="id" value={view.id} />
            <button
              type="submit"
              className={paperSecondaryButton}
            >
              {t.pauseMonitor}
            </button>
          </form>
        )}
        <Link
          href={`/console/${view.id}/edit`}
          className={paperSecondaryButton}
        >
          {t.editMonitor}
        </Link>
        <form action={deleteMonitorAction}>
          <input type="hidden" name="id" value={view.id} />
          <button
            type="submit"
            className={paperDangerButton}
          >
            {t.deleteMonitor}
          </button>
        </form>
      </div>

      <MonitorStatusCard
        view={view}
        now={at.getTime()}
        locale={locale}
        t={t}
        hideIdentity
      />

      <section className={paperCard}>
        <h2 className="border-b border-zinc-100 px-6 py-4 text-lg font-medium">
          {t.recentChecks}
        </h2>
        {checks.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-500">{t.noRecentChecks}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-6 py-2 font-medium">{t.now}</th>
                  <th className="px-4 py-2 font-medium">{t.checkResult}</th>
                  <th className="px-4 py-2 font-medium">{t.checkStatusCode}</th>
                  <th className="px-4 py-2 font-medium">{t.responseTime}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {checks.map((check) => (
                  <tr key={check.id}>
                    <td className="px-6 py-2 text-zinc-600">
                      {formatUtc(new Date(check.at), locale)}
                    </td>
                    <td className="px-4 py-2">
                      {check.success ? t.checkSuccessful : t.checkFailed}
                      {check.error ? (
                        <span className="ml-2 text-zinc-500">{check.error}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {check.statusCode ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {check.responseMs != null
                        ? `${check.responseMs} ${t.checkResponseMs}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}
