import { redirect } from "next/navigation";
import { PageShell } from "@/app/components/page-shell";
import { SignInForm } from "@/app/components/sign-in-form";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDictionary } from "@/lib/i18n/server";
import { formatUtc } from "@/lib/i18n/messages";
import Link from "next/link";

export default async function LoginPage() {
  const operator = await getCurrentOperator();
  if (operator) redirect("/console");

  const { locale, t } = await getDictionary();
  const now = formatUtc(new Date(), locale);

  return (
    <PageShell
      title={t.signIn}
      locale={locale}
      t={t}
      now={now}
      compact
      actions={
        <Link
          href="/"
          className="text-sm text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
        >
          {t.backToStatus}
        </Link>
      }
    >
      <section className="rounded-xl border border-zinc-200 bg-white px-6 py-6 shadow-sm">
        <SignInForm
          labels={{
            email: t.email,
            password: t.password,
            signIn: t.signIn,
            invalidCredentials: t.invalidCredentials,
          }}
        />
      </section>
    </PageShell>
  );
}
