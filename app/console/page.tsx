import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { CreateMonitorForm } from "@/app/components/monitor-form";
import { NowVsTypical } from "@/app/components/monitor-compare-table";
import { PageShell } from "@/app/components/page-shell";
import {
  availabilityLabel,
  stateBadgeClass,
  stateBarClass,
  stateLabel,
} from "@/app/components/status-styles";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { formatLastCheckLine, formatUpSince, formatUtc } from "@/lib/i18n/messages";
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
            <button
              type="submit"
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              {t.signOut}
            </button>
          </form>
          <Link
            href="/"
            className="text-sm text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
          >
            {t.viewStatusPage}
          </Link>
        </>
      }
    >
      <details
        className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm"
        open={monitors.length === 0}
      >
        <summary className="cursor-pointer text-lg font-medium">
          {t.createMonitor}
        </summary>
        <div className="mt-4">
          <CreateMonitorForm labels={formLabels} />
        </div>
      </details>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t.monitorsHeading}</h2>
        {monitors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white/70 px-6 py-10">
            <p className="text-lg font-medium">{t.consoleEmpty}</p>
            <p className="mt-2 text-zinc-600">{t.consoleHint}</p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            {monitors.map((monitor) => (
              <li key={monitor.id} className="flex">
                <div className={`w-1.5 shrink-0 ${stateBarClass(monitor.state)}`} />
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <Link
                    href={`/console/${monitor.id}`}
                    className="min-w-0 flex-1 hover:text-zinc-700"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{monitor.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateBadgeClass(monitor.state)}`}
                      >
                        {stateLabel(monitor.state, t)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-zinc-600">{monitor.url}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {monitor.lastCheck
                        ? formatLastCheckLine(monitor.lastCheck, nowMs, locale)
                        : t.noLastCheck}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {t.upSince}{" "}
                      <span className="font-medium text-zinc-800">
                        {formatUpSince(monitor.upSince, nowMs, locale) ?? "—"}
                      </span>
                      <span className="mx-2 text-zinc-300">·</span>
                      <NowVsTypical view={monitor} t={t} />
                      <span className="mx-2 text-zinc-300">·</span>
                      {t.isolatedFailsShort}{" "}
                      <span className="font-medium text-zinc-800">
                        {monitor.isolatedFailedChecks7d}
                      </span>
                      <span className="mx-2 text-zinc-300">·</span>
                      {t.availability90d}{" "}
                      <span className="font-medium text-zinc-800">
                        {availabilityLabel(monitor.availability90d)}
                      </span>
                      <span className="ml-2 text-xs uppercase tracking-wide text-zinc-400">
                        {monitor.public ? t.monitorPublicYes : t.monitorPublicNo}
                      </span>
                    </p>
                  </Link>
                  <Link
                    href={`/console/${monitor.id}`}
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    {t.viewMonitor}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
