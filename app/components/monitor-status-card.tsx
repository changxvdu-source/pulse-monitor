import { ResponseChart } from "@/app/components/response-chart";
import { NowVsTypical } from "@/app/components/monitor-compare-table";
import { paperCard } from "@/app/components/paper";
import {
  availabilityLabel,
  stateBadgeClass,
  stateBarClass,
  stateLabel,
} from "@/app/components/status-styles";
import { UptimeCalendar } from "@/app/components/uptime-calendar";
import {
  formatLastCheckLine,
  formatUpSince,
  formatUtc,
  type Locale,
  getMessages,
} from "@/lib/i18n/messages";
import type { StatusIncident, StatusMonitorView } from "@/lib/monitoring/monitoring";

type Messages = ReturnType<typeof getMessages>;

function incidentStatus(incident: StatusIncident, t: Messages) {
  if (!incident.closedAt) return t.incidentOpen;
  if (incident.closeReason === "paused") return t.incidentPaused;
  return t.incidentRecovered;
}

export function MonitorStatusCard(props: {
  view: StatusMonitorView;
  now: number;
  locale: Locale;
  t: Messages;
  heading?: "h1" | "h2";
  showUrl?: boolean;
  hideIdentity?: boolean;
  embedded?: boolean;
  historyOnly?: boolean;
}) {
  const { view, now, locale, t } = props;
  const Heading = props.heading ?? "h2";

  return (
    <article
      id={`monitor-${view.id}`}
      className={props.embedded ? "" : paperCard}
    >
      {props.historyOnly ? null : (
        <div className={`h-1.5 w-full ${stateBarClass(view.state)}`} />
      )}
      <div className="flex flex-col gap-6 px-6 py-6">
        {props.historyOnly ? null : props.hideIdentity ? (
          <div className="flex justify-end">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${stateBadgeClass(view.state)}`}
            >
              {stateLabel(view.state, t)}
            </span>
          </div>
        ) : (
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Heading className="text-2xl font-semibold tracking-tight">
                {view.name}
              </Heading>
              {props.showUrl ? (
                <p className="mt-1 truncate text-sm text-zinc-500">{view.url}</p>
              ) : null}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${stateBadgeClass(view.state)}`}
            >
              {stateLabel(view.state, t)}
            </span>
          </header>
        )}

        {props.historyOnly ? null : (
          <>
            <section>
              <h3 className="text-sm font-medium text-zinc-600">{t.lastCheck}</h3>
              {view.lastCheck ? (
                <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
                  {formatLastCheckLine(view.lastCheck, now, locale)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">{t.noLastCheck}</p>
              )}
              {view.slowerThanUsual ? (
                <p className="mt-1 text-sm font-medium text-amber-800">
                  {t.slowerThanUsual}
                </p>
              ) : null}
            </section>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-zinc-600">{t.upSince}</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums text-zinc-900">
                  {formatUpSince(view.upSince, now, locale) ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-600">{t.nowVsTypical}</dt>
                <dd className="mt-1">
                  <NowVsTypical view={view} t={t} />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-600">{t.isolatedFails7d}</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums text-zinc-900">
                  {view.isolatedFailedChecks7d}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-600">{t.availability90d}</dt>
                <dd className="mt-1 text-lg font-medium tabular-nums text-zinc-900">
                  {availabilityLabel(view.availability90d)}
                </dd>
              </div>
            </dl>
          </>
        )}

        <section>
          <h3 className="text-sm font-medium text-zinc-600">{t.calendarTitle}</h3>
          <div className="mt-3">
            <UptimeCalendar days={view.calendar} t={t} />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-zinc-600">{t.responseTime}</h3>
          <div className="mt-2">
            <ResponseChart
              series={view.series}
              typicalMs={view.typicalResponseMs}
              typicalLabel={t.typicalResponse}
              label={t.responseTime}
              emptyLabel={t.noResponseSamples}
              lastLabel={t.lastResponseMs}
            />
          </div>
        </section>

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
      </div>
    </article>
  );
}
