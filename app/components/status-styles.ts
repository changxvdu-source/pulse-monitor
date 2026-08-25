import type { MonitorState } from "@/lib/monitoring/monitoring";

export function stateLabel(
  state: MonitorState,
  t: { stateUp: string; stateDown: string; statePaused: string },
) {
  if (state === "Up") return t.stateUp;
  if (state === "Down") return t.stateDown;
  return t.statePaused;
}

export function stateBadgeClass(state: MonitorState) {
  if (state === "Up") return "bg-emerald-50 text-emerald-800";
  if (state === "Down") return "bg-red-50 text-red-800";
  return "bg-amber-50 text-amber-900";
}

export function stateBarClass(state: MonitorState) {
  if (state === "Up") return "bg-emerald-500";
  if (state === "Down") return "bg-red-500";
  return "bg-amber-400";
}

export function availabilityLabel(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
