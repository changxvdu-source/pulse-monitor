"use client";

import { useActionState } from "react";
import {
  createMonitorAction,
  updateMonitorAction,
  type MonitorFormState,
} from "@/app/monitor-actions";
import { paperInput, paperPrimaryButton } from "@/app/components/paper";

const initialState: MonitorFormState = {};

type Labels = {
  name: string;
  url: string;
  notificationEmail: string;
  notificationEmailHint: string;
  public: string;
  save: string;
  create: string;
  errors: {
    name_required: string;
    invalid_url: string;
    invalid_email: string;
    url_not_unique: string;
    not_found: string;
    unauthorized: string;
  };
};

type EditableMonitor = {
  id: string;
  name: string;
  url: string;
  public: boolean;
  notificationEmail: string | null;
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
  monitor: EditableMonitor;
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
  monitor?: EditableMonitor;
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
          className={paperInput}
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
          className={paperInput}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{props.labels.notificationEmail}</span>
        <input
          name="notificationEmail"
          type="email"
          defaultValue={props.monitor?.notificationEmail ?? ""}
          placeholder="ops@example.com"
          className={paperInput}
        />
        <span className="text-zinc-600">{props.labels.notificationEmailHint}</span>
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
        className={`self-start ${paperPrimaryButton}`}
      >
        {props.submitLabel}
      </button>
    </form>
  );
}
