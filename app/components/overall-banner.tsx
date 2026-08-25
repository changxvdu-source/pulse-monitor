import type { getMessages } from "@/lib/i18n/messages";
import type { OverallStatus } from "@/lib/monitoring/monitoring";

type Messages = ReturnType<typeof getMessages>;

export function OverallBanner(props: {
  status: OverallStatus;
  t: Messages;
}) {
  const { status, t } = props;

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

  return (
    <div className={`rounded-xl px-6 py-8 shadow-sm ${tone}`}>
      <p className="text-sm uppercase tracking-[0.2em] text-white/80">
        {t.statusTitle}
      </p>
      <p className="mt-2 text-2xl font-semibold">{label}</p>
    </div>
  );
}
