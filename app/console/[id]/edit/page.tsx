import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { EditMonitorForm } from "@/app/components/monitor-form";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";
import { getMonitor } from "@/lib/monitoring/monitoring";

export default async function EditMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const operator = await getCurrentOperator();
  if (!operator) redirect("/login");

  const { id } = await params;
  let monitor;
  try {
    monitor = getMonitor(getDb(), id);
  } catch {
    notFound();
  }

  const { locale, t } = await getDictionary();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            {t.appName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t.editMonitor}</h1>
          <p className="mt-1 text-sm text-zinc-600">{monitor.name}</p>
        </div>
        <LanguageSwitcher
          locale={locale}
          labels={{
            language: t.language,
            english: t.english,
            chinese: t.chinese,
          }}
        />
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white px-5 py-5">
        <EditMonitorForm
          monitor={monitor}
          labels={{
            name: t.monitorName,
            url: t.monitorUrl,
            public: t.monitorPublic,
            save: t.saveMonitor,
            create: t.createMonitor,
            errors: {
              name_required: t.errorNameRequired,
              invalid_url: t.errorInvalidUrl,
              url_not_unique: t.errorUrlNotUnique,
              not_found: t.errorNotFound,
              unauthorized: t.errorUnauthorized,
            },
          }}
        />
      </section>

      <Link href="/console" className="text-sm text-zinc-600 hover:text-zinc-900">
        ← {t.backToConsole}
      </Link>
    </main>
  );
}
