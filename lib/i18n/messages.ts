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
    errorUrlNotUnique: "That URL is already watched.",
    errorNotFound: "Monitor not found.",
    errorUnauthorized: "Sign in required.",
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
    errorUrlNotUnique: "这个 URL 已经在监控中。",
    errorNotFound: "找不到这只 Monitor。",
    errorUnauthorized: "请先登录。",
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
