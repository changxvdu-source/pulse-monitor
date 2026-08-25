import {
  availabilityLabel,
  stateBadgeClass,
  stateLabel,
} from "@/app/components/status-styles";
import {
  formatLastCheckLine,
  formatUpSince,
  type Locale,
  getMessages,
} from "@/lib/i18n/messages";
import type { StatusMonitorView } from "@/lib/monitoring/monitoring";

type Messages = ReturnType<typeof getMessages>;

export function MonitorCompareTable(props: {
  views: StatusMonitorView[];
  now: number;
  locale: Locale;
  t: Messages;
}) {
  const { views, now, locale, t } = props;

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <h2 className="border-b border-zinc-100 px-5 py-3 text-sm font-medium text-zinc-600">
        {t.compareHeading}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-2 font-medium">{t.monitorsHeading}</th>
              <th className="px-3 py-2 font-medium">{t.upSince}</th>
              <th className="px-3 py-2 font-medium">{t.lastCheck}</th>
              <th className="px-3 py-2 font-medium">{t.nowVsTypical}</th>
              <th className="px-3 py-2 font-medium">{t.isolatedFailsShort}</th>
              <th className="px-3 py-2 font-medium">{t.availability90d}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {views.map((view) => (
              <tr
                key={view.id}
                className={view.slowerThanUsual ? "bg-amber-50/60" : undefined}
              >
                <td className="px-5 py-3">
                  <a
                    href={`#monitor-${view.id}`}
                    className="font-medium hover:text-zinc-700"
                  >
                    {view.name}
                  </a>
                  <div className="mt-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateBadgeClass(view.state)}`}
                    >
                      {stateLabel(view.state, t)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 tabular-nums text-zinc-800">
                  {formatUpSince(view.upSince, now, locale) ?? "—"}
                </td>
                <td className="px-3 py-3 text-zinc-600">
                  {view.lastCheck
                    ? formatLastCheckLine(view.lastCheck, now, locale)
                    : t.noLastCheck}
                </td>
                <td className="px-3 py-3">
                  <NowVsTypical view={view} t={t} />
                </td>
                <td className="px-3 py-3 tabular-nums text-zinc-700">
                  {view.isolatedFailedChecks7d}
                </td>
                <td className="px-3 py-3 tabular-nums text-zinc-700">
                  {availabilityLabel(view.availability90d)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function NowVsTypical(props: {
  view: Pick<
    StatusMonitorView,
    "lastCheck" | "typicalResponseMs" | "slowerThanUsual"
  >;
  t: Messages;
}) {
  const current = props.view.lastCheck?.responseMs;
  const typical = props.view.typicalResponseMs;
  if (current == null && typical == null) {
    return <span className="text-zinc-400">—</span>;
  }

  return (
    <span className="tabular-nums">
      <span className="text-zinc-800">{current != null ? `${current} ms` : "—"}</span>
      <span className="text-zinc-400"> / </span>
      <span className="text-zinc-600">
        {typical != null ? `${typical} ms` : "—"}
      </span>
      {props.view.slowerThanUsual ? (
        <span className="ml-2 text-xs font-medium text-amber-800">
          {props.t.slowerThanUsual}
        </span>
      ) : null}
    </span>
  );
}
