import {
  formatHighlight,
  type Locale,
  getMessages,
} from "@/lib/i18n/messages";
import type {
  OverallStatus,
  StatusHighlight,
} from "@/lib/monitoring/monitoring";

type Messages = ReturnType<typeof getMessages>;

export function OverallBanner(props: {
  status: OverallStatus;
  highlight: StatusHighlight;
  locale: Locale;
  t: Messages;
}) {
  const { status, highlight, locale, t } = props;

  if (status === "empty") {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white/70 px-6 py-10">
        <p className="text-xl font-medium">{t.statusEmpty}</p>
        <p className="mt-2 text-zinc-600">{t.statusEmptyHint}</p>
      </div>
    );
  }

  const tone =
    status === "up"
      ? "bg-emerald-700 text-white"
      : status === "down"
        ? "bg-red-700 text-white"
        : "bg-amber-600 text-white";
  const label =
    status === "up"
      ? t.overallUp
      : status === "down"
        ? t.overallDown
        : t.overallPaused;
  const detail = formatHighlight(highlight, locale);

  return (
    <div className={`rounded-xl px-6 py-8 shadow-sm ${tone}`}>
      <p className="text-sm uppercase tracking-[0.2em] text-white/80">
        {t.statusTitle}
      </p>
      <p className="mt-2 font-serif text-2xl font-semibold tracking-tight">
        {label}
      </p>
      {detail ? (
        <p className="mt-3 text-sm text-white/90">{detail}</p>
      ) : null}
    </div>
  );
}
