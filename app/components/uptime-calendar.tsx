import type { getMessages } from "@/lib/i18n/messages";
import type { CalendarDay, CalendarDayKind } from "@/lib/monitoring/monitoring";

type Messages = ReturnType<typeof getMessages>;

const KIND_CLASS: Record<CalendarDayKind, string> = {
  none: "bg-zinc-200",
  up: "bg-emerald-500",
  down: "bg-red-500",
  paused: "bg-amber-400",
  mixed: "bg-orange-400",
};

function kindLabel(kind: CalendarDayKind, t: Messages): string {
  if (kind === "up") return t.legendUp;
  if (kind === "down") return t.legendDown;
  if (kind === "paused") return t.legendPaused;
  if (kind === "mixed") return t.legendMixed;
  return t.legendNone;
}

export function UptimeCalendar(props: {
  days: CalendarDay[];
  t: Messages;
}) {
  const { days, t } = props;
  const hasData = days.some((day) => day.kind !== "none");

  if (!hasData) {
    return <p className="text-sm text-zinc-500">{t.calendarEmpty}</p>;
  }

  return (
    <div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}
      >
        {days.map((day) => {
          const date = new Date(day.at).toISOString().slice(0, 10);
          return (
            <span
              key={day.at}
              title={`${date} UTC · ${kindLabel(day.kind, t)}`}
              className={`h-3 w-full rounded-sm ${KIND_CLASS[day.kind]}`}
            />
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
        {(
          [
            ["up", t.legendUp],
            ["down", t.legendDown],
            ["paused", t.legendPaused],
            ["mixed", t.legendMixed],
            ["none", t.legendNone],
          ] as const
        ).map(([kind, label]) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${KIND_CLASS[kind]}`} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
