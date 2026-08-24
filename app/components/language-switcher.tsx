import { setLocale } from "@/app/actions";
import type { Locale } from "@/lib/i18n/messages";

export function LanguageSwitcher(props: {
  locale: Locale;
  labels: { language: string; english: string; chinese: string };
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">{props.labels.language}</span>
      <form
        action={async () => {
          "use server";
          await setLocale("en");
        }}
      >
        <button
          type="submit"
          className={
            props.locale === "en"
              ? "rounded px-2 py-1 bg-zinc-900 text-white"
              : "rounded px-2 py-1 text-zinc-700 hover:bg-zinc-100"
          }
        >
          {props.labels.english}
        </button>
      </form>
      <form
        action={async () => {
          "use server";
          await setLocale("zh");
        }}
      >
        <button
          type="submit"
          className={
            props.locale === "zh"
              ? "rounded px-2 py-1 bg-zinc-900 text-white"
              : "rounded px-2 py-1 text-zinc-700 hover:bg-zinc-100"
          }
        >
          {props.labels.chinese}
        </button>
      </form>
    </div>
  );
}
