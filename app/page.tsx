import { LanguageSwitcher } from "@/app/components/language-switcher";
import { ResponseChart } from "@/app/components/response-chart";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { formatUtc, type Locale, getMessages } from "@/lib/i18n/messages";
import { getDictionary } from "@/lib/i18n/server";
import {
  getStatusPage,
  type MonitorState,
  type StatusIncident,
  type StatusMonitorView,
} from "@/lib/monitoring/monitoring";
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

function availabilityLabel(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function incidentStatus(
  incident: StatusIncident,
  t: ReturnType<typeof getMessages>,
) {
  if (!incident.closedAt) return t.incidentOpen;
  if (incident.closeReason === "paused") return t.incidentPaused;
  return t.incidentRecovered;
}

function MonitorCard(props: {
  view: StatusMonitorView;
  locale: Locale;
  t: ReturnType<typeof getMessages>;
}) {
  const { view, locale, t } = props;
  return (
    <article className="flex flex-col gap-5 rounded-lg border border-zinc-200 bg-white px-5 py-5">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-medium">{view.name}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateClass(view.state)}`}
        >
          {stateLabel(view.state, t)}
        </span>
      </header>

      <section>
        <h3 className="text-sm font-medium text-zinc-600">{t.responseTime}</h3>
        <div className="mt-2">
          <ResponseChart
            series={view.series}
            label={t.responseTime}
            emptyLabel={t.noResponseSamples}
          />
        </div>
      </section>

      <p className="text-sm text-zinc-700">
        {t.availability90d}:{" "}
        <span className="font-medium">{availabilityLabel(view.availability90d)}</span>
      </p>

      <section>
        <h3 className="text-sm font-medium text-zinc-600">{t.recentIncidents}</h3>
        {view.incidents.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">{t.noIncidents}</p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-100">
            {view.incidents.map((incident) => (
              <li key={incident.id} className="py-2 text-sm">
                <p className="font-medium">{incidentStatus(incident, t)}</p>
                <p className="text-zinc-600">
                  {t.openedAt}: {formatUtc(new Date(incident.openedAt), locale)}
                </p>
                {incident.closedAt ? (
                  <p className="text-zinc-600">
                    {t.closedAt}: {formatUtc(new Date(incident.closedAt), locale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

export default async function StatusPage() {
  const operator = await getCurrentOperator();
  const { locale, t } = await getDictionary();
  const now = formatUtc(new Date(), locale);
  const views = getStatusPage(getDb(), Date.now());

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            {t.appName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t.statusTitle}</h1>
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
          {operator ? (
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
          )}
        </div>
      </header>

      {views.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10">
          <p className="text-lg font-medium">{t.statusEmpty}</p>
          <p className="mt-2 text-zinc-600">{t.statusEmptyHint}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {views.map((view) => (
            <MonitorCard key={view.id} view={view} locale={locale} t={t} />
          ))}
        </div>
      )}

      <p className="text-sm text-zinc-500">
        {t.now}: {now}
      </p>
    </main>
  );
}
