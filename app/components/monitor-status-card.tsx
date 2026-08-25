import { ResponseChart } from "@/app/components/response-chart";
import {
  availabilityLabel,
  stateBadgeClass,
  stateBarClass,
  stateLabel,
} from "@/app/components/status-styles";
import { UptimeCalendar } from "@/app/components/uptime-calendar";
import { formatUtc, type Locale, getMessages } from "@/lib/i18n/messages";
import type { StatusIncident, StatusMonitorView } from "@/lib/monitoring/monitoring";

type Messages = ReturnType<typeof getMessages>;

function incidentStatus(incident: StatusIncident, t: Messages) {
  if (!incident.closedAt) return t.incidentOpen;
  if (incident.closeReason === "paused") return t.incidentPaused;
  return t.incidentRecovered;
}

export function MonitorStatusCard(props: {
  view: StatusMonitorView;
  locale: Locale;
  t: Messages;
  heading?: "h1" | "h2";
  showUrl?: boolean;
  hideIdentity?: boolean;
}) {
  const { view, locale, t } = props;
  const Heading = props.heading ?? "h2";

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className={`h-1.5 w-full ${stateBarClass(view.state)}`} />
      <div className="flex flex-col gap-6 px-6 py-6">
        {props.hideIdentity ? (
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

        <p className="text-sm text-zinc-600">
          {t.availability90d}
          <span className="ml-2 text-3xl font-semibold tracking-tight text-zinc-900">
            {availabilityLabel(view.availability90d)}
          </span>
        </p>

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
