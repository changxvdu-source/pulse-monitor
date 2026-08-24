"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate } from "@/lib/auth/operator";
import { bootstrapOperator } from "@/lib/auth/bootstrap";
import { SESSION_COOKIE } from "@/lib/auth/current";
import { requireAuthEnv } from "@/lib/auth/env";
import { createSessionToken } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/messages";

export type SignInState = {
  error?: string;
};

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  await bootstrapOperator();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const operator = await authenticate(getDb(), { email, password });
  if (!operator) {
    return { error: "invalid" };
  }

  const { sessionSecret } = requireAuthEnv();
  const token = createSessionToken({
    operatorId: operator.id,
    secret: sessionSecret,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/console");
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
