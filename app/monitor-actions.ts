"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOperator } from "@/lib/auth/current";
import { getDb } from "@/lib/db";
import {
  createMonitor,
  deleteMonitor,
  pauseMonitor,
  resumeMonitor,
  updateMonitor,
} from "@/lib/monitoring/monitoring";

export type MonitorFormState = {
  error?: "name_required" | "invalid_url" | "url_not_unique" | "not_found" | "unauthorized";
};

function readMonitorInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    url: String(formData.get("url") ?? ""),
    public: formData.get("public") === "on",
  };
}

function mapError(error: unknown): MonitorFormState["error"] {
  if (!(error instanceof Error)) return "invalid_url";
  if (
    error.message === "name_required" ||
    error.message === "invalid_url" ||
    error.message === "url_not_unique" ||
    error.message === "not_found"
  ) {
    return error.message;
  }
  throw error;
}

async function requireOperator() {
  const operator = await getCurrentOperator();
  if (!operator) return null;
  return operator;
}

export async function createMonitorAction(
  _prev: MonitorFormState,
  formData: FormData,
): Promise<MonitorFormState> {
  if (!(await requireOperator())) return { error: "unauthorized" };

  try {
    createMonitor(getDb(), readMonitorInput(formData), Date.now());
  } catch (error) {
    return { error: mapError(error) };
  }

  revalidatePath("/console");
  redirect("/console");
}

export async function updateMonitorAction(
  _prev: MonitorFormState,
  formData: FormData,
): Promise<MonitorFormState> {
  if (!(await requireOperator())) return { error: "unauthorized" };
  const id = String(formData.get("id") ?? "");

  try {
    updateMonitor(getDb(), id, readMonitorInput(formData));
  } catch (error) {
    return { error: mapError(error) };
  }

  revalidatePath("/console");
  redirect("/console");
}

export async function deleteMonitorAction(formData: FormData) {
  if (!(await requireOperator())) redirect("/login");
  const id = String(formData.get("id") ?? "");
  try {
    deleteMonitor(getDb(), id);
  } catch (error) {
    if (error instanceof Error && error.message === "not_found") {
      revalidatePath("/console");
      return;
    }
    throw error;
  }
  revalidatePath("/console");
}

export async function pauseMonitorAction(formData: FormData) {
  if (!(await requireOperator())) redirect("/login");
  const id = String(formData.get("id") ?? "");
  pauseMonitor(getDb(), id, Date.now());
  revalidatePath("/console");
}

export async function resumeMonitorAction(formData: FormData) {
  if (!(await requireOperator())) redirect("/login");
  const id = String(formData.get("id") ?? "");
  resumeMonitor(getDb(), id, Date.now());
  revalidatePath("/console");
}
