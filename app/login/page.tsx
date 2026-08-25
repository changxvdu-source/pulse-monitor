import { redirect } from "next/navigation";
import { PageShell } from "@/app/components/page-shell";
import { paperCard, paperTextLink } from "@/app/components/paper";
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
          className={paperTextLink}
        >
          {t.backToStatus}
        </Link>
      }
    >
      <section className={`${paperCard} px-6 py-6`}>
        <SignInForm
          labels={{
            email: t.email,
            password: t.password,
            signIn: t.signIn,
            invalidCredentials: t.invalidCredentials,
            loginThrottled: t.loginThrottled,
          }}
        />
      </section>
    </PageShell>
  );
}
