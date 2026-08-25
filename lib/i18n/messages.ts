import type { LastCheck, StatusHighlight } from "@/lib/monitoring/monitoring";

export type Locale = "en" | "zh";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "pulse_locale";

const messages = {
  en: {
    appName: "Pulse",
    signIn: "Sign in",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
    consoleTitle: "Console",
    consoleEmpty: "No Monitors yet.",
    consoleHint: "Add a Monitor with a name and HTTP(S) URL.",
    invalidCredentials: "Invalid email or password.",
    loginThrottled: "Too many sign-in attempts. Try again in 15 minutes.",
    language: "Language",
    english: "English",
    chinese: "中文",
    utcLabel: "UTC",
    now: "Now",
    monitorsHeading: "Monitors",
    createMonitor: "Add Monitor",
    editMonitor: "Edit Monitor",
    saveMonitor: "Save",
    deleteMonitor: "Delete",
    monitorName: "Name",
    monitorUrl: "URL",
    monitorNotificationEmail: "Notification address",
    monitorNotificationEmailHint: "Leave empty to email the Operator.",
    monitorPublic: "Public on Status Page",
    monitorPublicYes: "Public",
    monitorPublicNo: "Private",
    stateUp: "Up",
    stateDown: "Down",
    statePaused: "Paused",
    pauseMonitor: "Pause",
    resumeMonitor: "Resume",
    backToConsole: "Back to console",
    errorNameRequired: "Name is required.",
    errorInvalidUrl: "URL must be http or https.",
    errorInvalidEmail: "Notification address must be an email.",
    errorUrlNotUnique: "That URL is already watched.",
    errorNotFound: "Monitor not found.",
    errorUnauthorized: "Sign in required.",
    statusTitle: "Status",
    statusEmpty: "No Public Monitors yet.",
    statusEmptyHint: "The Operator has not published any Monitors.",
    availability90d: "90-day Availability",
    recentIncidents: "Recent Incidents",
    noIncidents: "No Incidents yet.",
    responseTime: "Response time",
    noResponseSamples: "No response-time samples yet.",
    incidentOpen: "Open",
    incidentRecovered: "Recovered",
    incidentPaused: "Closed (Paused)",
    openedAt: "Opened",
    closedAt: "Closed",
    viewStatusPage: "Status Page",
    operatorSignIn: "Operator sign in",
    backToStatus: "Status Page",
    overallUp: "All Public Monitors are Up",
    overallDown: "A Public Monitor is Down",
    overallPaused: "All Public Monitors are Paused",
    calendarTitle: "90-day calendar",
    calendarEmpty: "No calendar data yet.",
    legendUp: "Up",
    legendDown: "Down",
    legendPaused: "Paused",
    legendMixed: "Mixed",
    legendNone: "No data",
    recentChecks: "Recent Checks",
    noRecentChecks: "No Checks yet.",
    checkSuccessful: "Successful",
    checkFailed: "Failed",
    checkStatusCode: "Status",
    checkResponseMs: "ms",
    lastResponseMs: "Last",
    viewMonitor: "Open",
    checkResult: "Result",
    lastCheck: "Last Check",
    typicalResponse: "Typical (7d)",
    nowVsTypical: "Now / typical",
    isolatedFails7d: "Isolated Failed Checks (7d)",
    isolatedFailsShort: "Isolated (7d)",
    slowerThanUsual: "Slower than usual",
    noLastCheck: "No Checks yet",
    justNow: "Just now",
    historyDetails: "Response time, calendar, and Incidents",
    compareHeading: "Each Public Monitor",
    upSince: "Up Since",
  },
  zh: {
    appName: "Pulse",
    signIn: "登录",
    signOut: "退出",
    email: "邮箱",
    password: "密码",
    consoleTitle: "控制台",
    consoleEmpty: "还没有 Monitor。",
    consoleHint: "用显示名和 HTTP(S) URL 添加一只 Monitor。",
    invalidCredentials: "邮箱或密码不正确。",
    loginThrottled: "登录尝试过多，请 15 分钟后再试。",
    language: "语言",
    english: "English",
    chinese: "中文",
    utcLabel: "UTC",
    now: "现在",
    monitorsHeading: "Monitor 列表",
    createMonitor: "添加 Monitor",
    editMonitor: "编辑 Monitor",
    saveMonitor: "保存",
    deleteMonitor: "删除",
    monitorName: "显示名",
    monitorUrl: "URL",
    monitorNotificationEmail: "Notification 地址",
    monitorNotificationEmailHint: "留空则发给 Operator。",
    monitorPublic: "在状态页公开",
    monitorPublicYes: "公开",
    monitorPublicNo: "私有",
    stateUp: "Up",
    stateDown: "Down",
    statePaused: "已暂停",
    pauseMonitor: "暂停",
    resumeMonitor: "恢复",
    backToConsole: "返回控制台",
    errorNameRequired: "显示名不能为空。",
    errorInvalidUrl: "URL 必须是 http 或 https。",
    errorInvalidEmail: "Notification 地址必须是邮箱。",
    errorUrlNotUnique: "这个 URL 已经在监控中。",
    errorNotFound: "找不到这只 Monitor。",
    errorUnauthorized: "请先登录。",
    statusTitle: "状态",
    statusEmpty: "还没有公开的 Monitor。",
    statusEmptyHint: "Operator 还没有把任何 Monitor 标为公开。",
    availability90d: "90 天 Availability",
    recentIncidents: "最近 Incident",
    noIncidents: "还没有 Incident。",
    responseTime: "响应时间",
    noResponseSamples: "还没有响应时间样本。",
    incidentOpen: "进行中",
    incidentRecovered: "已恢复",
    incidentPaused: "已关闭（暂停）",
    openedAt: "开始",
    closedAt: "结束",
    viewStatusPage: "状态页",
    operatorSignIn: "Operator 登录",
    backToStatus: "状态页",
    overallUp: "公开 Monitor 全部 Up",
    overallDown: "有公开 Monitor 处于 Down",
    overallPaused: "公开 Monitor 全部已暂停",
    calendarTitle: "90 天日历",
    calendarEmpty: "还没有日历数据。",
    legendUp: "Up",
    legendDown: "Down",
    legendPaused: "已暂停",
    legendMixed: "混合",
    legendNone: "无数据",
    recentChecks: "最近 Check",
    noRecentChecks: "还没有 Check。",
    checkSuccessful: "成功",
    checkFailed: "失败",
    checkStatusCode: "状态码",
    checkResponseMs: "ms",
    lastResponseMs: "最近",
    viewMonitor: "打开",
    checkResult: "结果",
    lastCheck: "上次 Check",
    typicalResponse: "往常（7 天）",
    nowVsTypical: "现在 / 往常",
    isolatedFails7d: "近 7 天孤立 Failed Check",
    isolatedFailsShort: "孤立失败（7 天）",
    slowerThanUsual: "偏慢",
    noLastCheck: "还没有 Check",
    justNow: "刚刚",
    historyDetails: "响应时间、日历和 Incident",
    compareHeading: "每只公开 Monitor",
    upSince: "Up Since",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "zh";
}

export function getMessages(locale: Locale) {
  return messages[locale];
}

export function formatUtc(date: Date, locale: Locale): string {
  const formatted = date.toISOString().replace(/\.\d{3}Z$/, "Z");
  return `${formatted} ${messages[locale].utcLabel}`;
}

export function formatAge(ms: number, locale: Locale): string {
  if (ms < 45_000) return messages[locale].justNow;
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) {
    if (locale === "zh") return `${minutes} 分钟前`;
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 36) {
    if (locale === "zh") return `${hours} 小时前`;
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  const days = Math.round(hours / 24);
  if (locale === "zh") return `${days} 天前`;
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatUpSince(
  upSince: number | null,
  now: number,
  locale: Locale,
): string | null {
  if (upSince == null) return null;
  const ms = Math.max(0, now - upSince);
  if (ms < 45_000) return messages[locale].justNow;
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) {
    if (locale === "zh") return `${minutes} 分钟`;
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 36) {
    if (locale === "zh") return `${hours} 小时`;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  const days = Math.round(hours / 24);
  if (locale === "zh") return `${days} 天`;
  return days === 1 ? "1 day" : `${days} days`;
}

export function formatLastCheckLine(
  last: LastCheck,
  now: number,
  locale: Locale,
): string {
  const age = formatAge(Math.max(0, now - last.at), locale);
  const result = last.success
    ? last.statusCode != null
      ? `HTTP ${last.statusCode}`
      : messages[locale].checkSuccessful
    : (last.error ??
      (last.statusCode != null
        ? `HTTP ${last.statusCode}`
        : messages[locale].checkFailed));
  const timing = last.responseMs != null ? `${last.responseMs} ms` : null;
  return [age, result, timing].filter(Boolean).join(" · ");
}

export function formatHighlight(
  highlight: StatusHighlight,
  locale: Locale,
): string | null {
  switch (highlight.kind) {
    case "empty":
    case "up":
      return null;
    case "paused":
      return messages[locale].overallPaused;
    case "down":
      return locale === "zh"
        ? `${highlight.name} 处于 Down`
        : `${highlight.name} is Down`;
    case "slower":
      return locale === "zh"
        ? `${highlight.name} 偏慢：${highlight.responseMs} ms，往常 ${highlight.typicalMs} ms`
        : `${highlight.name} is slower than usual: ${highlight.responseMs} ms vs typical ${highlight.typicalMs} ms`;
    case "isolated_fails":
      return locale === "zh"
        ? `${highlight.name}：近 7 天 ${highlight.count} 次孤立 Failed Check`
        : `${highlight.name}: ${highlight.count} isolated Failed Checks in 7 days`;
    case "checked":
      return locale === "zh"
        ? `最近一次 Check：${highlight.name} · ${formatUtc(new Date(highlight.at), locale)}`
        : `Last Check: ${highlight.name} · ${formatUtc(new Date(highlight.at), locale)}`;
  }
}
