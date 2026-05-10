import type { ReactNode } from "react";
import type { TaskPriority, TaskStatus } from "../types";

const statusClass: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700 ring-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200",
  REVIEW: "bg-amber-50 text-amber-700 ring-amber-200",
  DONE: "bg-emerald-50 text-emerald-700 ring-emerald-200"
};

const priorityClass: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-200",
  MEDIUM: "bg-teal-50 text-teal-700 ring-teal-200",
  HIGH: "bg-orange-50 text-orange-700 ring-orange-200"
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "admin" | "danger" }) {
  const tones = {
    neutral: "bg-white text-slate-700 ring-line",
    admin: "bg-ink text-white ring-ink",
    danger: "bg-red-50 text-red-700 ring-red-200"
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tones[tone]}`}>{children}</span>;
}

export function StatusBadge({ status, label }: { status: TaskStatus; label: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass[status]}`}>{label}</span>;
}

export function PriorityBadge({ priority, label }: { priority: TaskPriority; label: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${priorityClass[priority]}`}>{label}</span>;
}
