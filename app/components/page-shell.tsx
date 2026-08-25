import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import type { Locale, getMessages } from "@/lib/i18n/messages";

type Messages = ReturnType<typeof getMessages>;

export function PageShell(props: {
  title: string;
  subtitle?: ReactNode;
  locale: Locale;
  t: Messages;
  actions?: ReactNode;
  children: ReactNode;
  now: string;
  compact?: boolean;
}) {
  return (
    <main
      className={`mx-auto flex min-h-full w-full flex-col gap-8 px-6 py-12 ${
        props.compact ? "max-w-lg" : "max-w-5xl"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            {props.t.appName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {props.title}
          </h1>
          {props.subtitle ? (
            <div className="mt-1 text-sm text-zinc-600">{props.subtitle}</div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-3">
          <LanguageSwitcher
            locale={props.locale}
            labels={{
              language: props.t.language,
              english: props.t.english,
              chinese: props.t.chinese,
            }}
          />
          {props.actions}
        </div>
      </header>
      {props.children}
      <p className="text-sm text-zinc-500">
        {props.t.now}: {props.now}
      </p>
    </main>
  );
}
