import type { Locale } from "@/lib/i18n/messages";

export type ComposeInput =
  | {
      kind: "incident_opened";
      monitorName: string;
      openedAt: number;
    }
  | {
      kind: "incident_closed";
      reason: "recovered" | "paused";
      monitorName: string;
      openedAt: number;
      closedAt: number;
    };

export type ComposedMail = {
  subject: string;
  text: string;
};

export function composeNotification(
  input: ComposeInput,
  locale: Locale,
): ComposedMail {
  const stamp = formatMailUtc(input.kind === "incident_opened" ? input.openedAt : input.closedAt);
  const name = input.monitorName;

  if (input.kind === "incident_opened") {
    if (locale === "zh") {
      return {
        subject: `[Pulse] ${name} 变为 Down`,
        text: [
          `${name} 变为 Down。`,
          "",
          `Incident 于 ${formatMailUtc(input.openedAt)} 打开。`,
        ].join("\n"),
      };
    }
    return {
      subject: `[Pulse] ${name} is Down`,
      text: [
        `${name} is Down.`,
        "",
        `An Incident opened at ${formatMailUtc(input.openedAt)}.`,
      ].join("\n"),
    };
  }

  const duration = formatDuration(input.closedAt - input.openedAt, locale);

  if (input.reason === "paused") {
    if (locale === "zh") {
      return {
        subject: `[Pulse] ${name} 已暂停`,
        text: [
          `${name} 已暂停，Incident 已关闭。`,
          "",
          `关闭时间 ${stamp}，持续了 ${duration}。原因：paused。`,
        ].join("\n"),
      };
    }
    return {
      subject: `[Pulse] ${name} was paused`,
      text: [
        `${name} was paused.`,
        "",
        `The Incident was closed because the Monitor was paused at ${stamp}. It lasted ${duration}.`,
      ].join("\n"),
    };
  }

  if (locale === "zh") {
    return {
      subject: `[Pulse] ${name} 变为 Up`,
      text: [
        `${name} 变为 Up。`,
        "",
        `Incident 于 ${stamp} 关闭，持续了 ${duration}。`,
      ].join("\n"),
    };
  }

  return {
    subject: `[Pulse] ${name} is Up`,
    text: [
      `${name} is Up.`,
      "",
      `The Incident closed at ${stamp} after ${duration}.`,
    ].join("\n"),
  };
}

function formatMailUtc(at: number): string {
  const iso = new Date(at).toISOString().replace(/\.\d{3}Z$/, "Z");
  return `${iso} UTC`;
}

function formatDuration(ms: number, locale: Locale): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (locale === "zh") {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} 小时` : `${hours} 小时 ${rest} 分钟`;
  }
  if (minutes < 60) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourPart = hours === 1 ? "1 hour" : `${hours} hours`;
  if (rest === 0) return hourPart;
  const minutePart = rest === 1 ? "1 minute" : `${rest} minutes`;
  return `${hourPart} ${minutePart}`;
}
