import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { CreateMonitorForm } from "@/app/components/monitor-form";
import {
  deleteMonitorAction,
  pauseMonitorAction,
  resumeMonitorAction,
} from "@/app/monitor-actions";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { formatUtc } from "@/lib/i18n/messages";
import { getDictionary } from "@/lib/i18n/server";
import { listMonitors, type MonitorState } from "@/lib/monitoring/monitoring";
import Link from "next/link";

function stateLabel(
  state: MonitorState,
  t: { stateUp: string; stateDown: string; statePaused: string },
) {
  if (state === "Up") return t.stateUp;
  if (state === "Down") return t.stateDown;
  return t.statePaused;
}

function stateClass(state: MonitorState) {
  if (state === "Up") return "bg-emerald-50 text-emerald-800";
  if (state === "Down") return "bg-red-50 text-red-800";
  return "bg-amber-50 text-amber-900";
}

export default async function ConsolePage() {
  const operator = await getCurrentOperator();
  if (!operator) redirect("/login");

  const { locale, t } = await getDictionary();
  const now = formatUtc(new Date(), locale);
  const monitors = listMonitors(getDb());

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
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            {t.appName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t.consoleTitle}</h1>
          <p className="mt-1 text-sm text-zinc-600">{operator.email}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <LanguageSwitcher
            locale={locale}
            labels={{
              language: t.language,
              english: t.english,
              chinese: t.chinese,
            }}
          />
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
        </div>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white px-5 py-5">
        <h2 className="text-lg font-medium">{t.createMonitor}</h2>
        <div className="mt-4">
          <CreateMonitorForm labels={formLabels} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t.monitorsHeading}</h2>
        {monitors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10">
            <p className="text-lg font-medium">{t.consoleEmpty}</p>
            <p className="mt-2 text-zinc-600">{t.consoleHint}</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {monitors.map((monitor) => (
              <li
                key={monitor.id}
                className="flex flex-wrap items-start justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{monitor.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateClass(monitor.state)}`}
                    >
                      {stateLabel(monitor.state, t)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-zinc-600">{monitor.url}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                    {monitor.public ? t.monitorPublicYes : t.monitorPublicNo}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {monitor.paused ? (
                    <form action={resumeMonitorAction}>
                      <input type="hidden" name="id" value={monitor.id} />
                      <button
                        type="submit"
                        className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                      >
                        {t.resumeMonitor}
                      </button>
                    </form>
                  ) : (
                    <form action={pauseMonitorAction}>
                      <input type="hidden" name="id" value={monitor.id} />
                      <button
                        type="submit"
                        className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                      >
                        {t.pauseMonitor}
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/console/${monitor.id}/edit`}
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    {t.editMonitor}
                  </Link>
                  <form action={deleteMonitorAction}>
                    <input type="hidden" name="id" value={monitor.id} />
                    <button
                      type="submit"
                      className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      {t.deleteMonitor}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-zinc-500">
        {t.now}: {now}
      </p>
    </main>
  );
}
