import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { SignInForm } from "@/app/components/sign-in-form";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDictionary } from "@/lib/i18n/server";
import { formatUtc } from "@/lib/i18n/messages";

export default async function LoginPage() {
  const operator = await getCurrentOperator();
  if (operator) redirect("/console");

  const { locale, t } = await getDictionary();
  const now = formatUtc(new Date(), locale);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            {t.appName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t.signIn}</h1>
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
      <SignInForm
        labels={{
          email: t.email,
          password: t.password,
          signIn: t.signIn,
          invalidCredentials: t.invalidCredentials,
        }}
      />
      <p className="text-sm text-zinc-500">
        {t.now}: {now}
      </p>
    </main>
  );
}
