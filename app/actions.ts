"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate, setOperatorLocale } from "@/lib/auth/operator";
import { bootstrapOperator } from "@/lib/auth/bootstrap";
import { getCurrentOperator, SESSION_COOKIE } from "@/lib/auth/current";
import { requireAuthEnv } from "@/lib/auth/env";
import {
  clientIp,
  isThrottled,
  recordFailure,
  recordSuccess,
} from "@/lib/auth/login-limit";
import { createSessionToken, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
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

  const ip = clientIp(await headers());
  if (isThrottled(ip)) {
    return { error: "throttled" };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const operator = await authenticate(getDb(), { email, password });
  if (!operator) {
    recordFailure(ip);
    return { error: "invalid" };
  }

  recordSuccess(ip);

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
    maxAge: SESSION_MAX_AGE_SECONDS,
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
  const operator = await getCurrentOperator();
  if (operator) {
    setOperatorLocale(getDb(), locale);
  }
  revalidatePath("/", "layout");
}
