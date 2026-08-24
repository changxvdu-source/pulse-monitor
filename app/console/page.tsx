import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { getCurrentOperator } from "@/lib/auth/current";
import { formatUtc } from "@/lib/i18n/messages";
import { getDictionary } from "@/lib/i18n/server";

export default async function ConsolePage() {
  const operator = await getCurrentOperator();
  if (!operator) redirect("/login");

  const { locale, t } = await getDictionary();
  const now = formatUtc(new Date(), locale);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            {t.appName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t.consoleTitle}</h1>
          <p className="mt-1 text-sm text-zinc-600">{operator.email}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <LanguageSwitcher
            locale={locale}
            labels={{
              language: t.language,
              english: t.english,
              chinese: t.chinese,
            }}
          />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              {t.signOut}
            </button>
          </form>
        </div>
      </header>

      <section className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10">
        <h2 className="text-lg font-medium">{t.consoleEmpty}</h2>
        <p className="mt-2 text-zinc-600">{t.consoleHint}</p>
      </section>

      <p className="text-sm text-zinc-500">
        {t.now}: {now}
      </p>
    </main>
  );
}
