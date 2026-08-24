"use client";

import { useActionState } from "react";
import {
  createMonitorAction,
  updateMonitorAction,
  type MonitorFormState,
} from "@/app/monitor-actions";

const initialState: MonitorFormState = {};

type Labels = {
  name: string;
  url: string;
  public: string;
  save: string;
  create: string;
  errors: {
    name_required: string;
    invalid_url: string;
    url_not_unique: string;
    not_found: string;
    unauthorized: string;
  };
};

export function CreateMonitorForm(props: { labels: Labels }) {
  const [state, action, pending] = useActionState(
    createMonitorAction,
    initialState,
  );

  return (
    <MonitorFields
      action={action}
      pending={pending}
      state={state}
      labels={props.labels}
      submitLabel={props.labels.create}
    />
  );
}

export function EditMonitorForm(props: {
  labels: Labels;
  monitor: { id: string; name: string; url: string; public: boolean };
}) {
  const [state, action, pending] = useActionState(
    updateMonitorAction,
    initialState,
  );

  return (
    <MonitorFields
      action={action}
      pending={pending}
      state={state}
      labels={props.labels}
      submitLabel={props.labels.save}
      monitor={props.monitor}
    />
  );
}

function MonitorFields(props: {
  action: (payload: FormData) => void;
  pending: boolean;
  state: MonitorFormState;
  labels: Labels;
  submitLabel: string;
  monitor?: { id: string; name: string; url: string; public: boolean };
}) {
  return (
    <form action={props.action} className="flex flex-col gap-3">
      {props.monitor ? (
        <input type="hidden" name="id" value={props.monitor.id} />
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        <span>{props.labels.name}</span>
        <input
          name="name"
          required
          defaultValue={props.monitor?.name}
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{props.labels.url}</span>
        <input
          name="url"
          type="url"
          required
          defaultValue={props.monitor?.url}
          placeholder="https://example.com"
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="public"
          type="checkbox"
          defaultChecked={props.monitor?.public ?? false}
        />
        <span>{props.labels.public}</span>
      </label>
      {props.state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {props.labels.errors[props.state.error]}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={props.pending}
        className="self-start rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {props.submitLabel}
      </button>
    </form>
  );
}
