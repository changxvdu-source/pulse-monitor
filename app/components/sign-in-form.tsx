"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions";

const initialState: SignInState = {};

export function SignInForm(props: {
  labels: {
    email: string;
    password: string;
    signIn: string;
    invalidCredentials: string;
    loginThrottled: string;
  };
}) {
  const [state, action, pending] = useActionState(signIn, initialState);
  const error =
    state.error === "throttled"
      ? props.labels.loginThrottled
      : state.error
        ? props.labels.invalidCredentials
        : null;

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span>{props.labels.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{props.labels.password}</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {props.labels.signIn}
      </button>
    </form>
  );
}
