import type { MonitorState } from "@/lib/monitoring/monitoring";

export function historyDetailsOpen(monitor: {
  state: MonitorState;
  slowerThanUsual: boolean;
}): boolean {
  return monitor.state === "Down";
}
