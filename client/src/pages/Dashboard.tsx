import { AlertTriangle, CheckCircle2, ClipboardList, FolderKanban } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { api } from "../lib/api";
import { formatDate, isOverdue, priorityLabels, statusLabels } from "../lib/format";
import type { DashboardPayload, TaskStatus } from "../types";

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export function Dashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashboardPayload>("/api/dashboard").then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <Layout><p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p></Layout>;
  if (!data) return <Layout><DashboardSkeleton /></Layout>;

  return (
    <Layout>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Overview</p>
          <h2 className="text-3xl font-bold">Dashboard</h2>
        </div>
        <Link to="/projects" className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">Manage projects</Link>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FolderKanban />} label="Projects" value={data.stats.projectCount} />
        <StatCard icon={<ClipboardList />} label="Tasks" value={data.stats.taskCount} />
        <StatCard icon={<CheckCircle2 />} label="Done" value={data.stats.doneCount} />
        <StatCard icon={<AlertTriangle />} label="Overdue" value={data.stats.overdueCount} danger />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h3 className="text-lg font-semibold">Status distribution</h3>
          <div className="mt-5 space-y-4">
            {statuses.map((status) => {
              const count = data.statusCounts[status] ?? 0;
              const percent = data.stats.taskCount ? Math.round((count / data.stats.taskCount) * 100) : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{statusLabels[status]}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-teal" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <TaskPanel title="My assigned tasks" tasks={data.myTasks} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <TaskPanel title="Overdue work" tasks={data.overdueTasks} empty="No overdue tasks. Nice and tidy." />
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h3 className="text-lg font-semibold">Active projects</h3>
          <div className="mt-4 space-y-3">
            {data.projects.length === 0 && <p className="text-sm text-slate-500">Create your first project to start tracking team work.</p>}
            {data.projects.slice(0, 5).map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="block rounded-md border border-line p-4 hover:border-teal">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{project.name}</p>
                  <span className="text-sm text-slate-500">{project.tasks.length} tasks</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description || "No description"}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function StatCard({ icon, label, value, danger = false }: { icon: React.ReactNode; label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className={`mb-4 inline-flex rounded-md p-2 ${danger ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal"}`}>{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

function TaskPanel({ title, tasks, empty = "No tasks assigned yet." }: { title: string; tasks: DashboardPayload["myTasks"]; empty?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {tasks.length === 0 && <p className="text-sm text-slate-500">{empty}</p>}
        {tasks.map((task) => (
          <Link key={task.id} to={`/projects/${task.project?.id}`} className="block rounded-md border border-line p-4 hover:border-teal">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} label={statusLabels[task.status]} />
              <PriorityBadge priority={task.priority} label={priorityLabels[task.priority]} />
              {isOverdue(task.dueDate, task.status) && <span className="text-xs font-semibold text-red-700">Overdue</span>}
            </div>
            <p className="mt-3 font-semibold">{task.title}</p>
            <p className="mt-1 text-sm text-slate-500">{task.project?.name} · {formatDate(task.dueDate)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-lg bg-white" />)}</div>;
}
