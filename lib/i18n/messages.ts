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
    consoleHint: "Monitors will appear here in the next ticket.",
    invalidCredentials: "Invalid email or password.",
    language: "Language",
    english: "English",
    chinese: "中文",
    utcLabel: "UTC",
    now: "Now",
  },
  zh: {
    appName: "Pulse",
    signIn: "登录",
    signOut: "退出",
    email: "邮箱",
    password: "密码",
    consoleTitle: "控制台",
    consoleEmpty: "还没有 Monitor。",
    consoleHint: "下一张工单会在这里管理 Monitor。",
    invalidCredentials: "邮箱或密码不正确。",
    language: "语言",
    english: "English",
    chinese: "中文",
    utcLabel: "UTC",
    now: "现在",
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
