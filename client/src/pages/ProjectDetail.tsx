import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge, PriorityBadge, StatusBadge } from "../components/Badge";
import { Layout } from "../components/Layout";
import { useAuth } from "../components/AuthProvider";
import { api } from "../lib/api";
import { formatDate, isOverdue, priorityLabels, statusLabels } from "../lib/format";
import type { Project, ProjectRole, Task, TaskPriority, TaskStatus } from "../types";

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

export function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");

  const myMembership = project?.members.find((member) => member.user.id === user?.id);
  const isAdmin = myMembership?.role === "ADMIN";

  async function loadProject() {
    if (!id) return;
    const data = await api<{ project: Project }>(`/api/projects/${id}`);
    setProject(data.project);
  }

  useEffect(() => {
    loadProject().catch((err) => setError(err.message));
  }, [id]);

  async function updateTask(taskId: string, status: TaskStatus) {
    setError("");
    try {
      await api<{ task: Task }>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update task");
    }
  }

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
    project?.tasks.forEach((task) => grouped[task.status].push(task));
    return grouped;
  }, [project]);

  if (error && !project) return <Layout><p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p></Layout>;
  if (!project) return <Layout><div className="h-72 animate-pulse rounded-lg bg-white" /></Layout>;

  return (
    <Layout>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Project</p>
          <h2 className="mt-1 text-3xl font-bold">{project.name}</h2>
          <p className="mt-2 max-w-3xl text-slate-500">{project.description || "No project description."}</p>
        </div>
        <Badge tone={isAdmin ? "admin" : "neutral"}>{isAdmin ? "Admin access" : "Member access"}</Badge>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {statuses.map((status) => (
              <div key={status} className="rounded-lg border border-line bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{statusLabels[status]}</h3>
                  <span className="text-sm text-slate-500">{tasksByStatus[status].length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {tasksByStatus[status].length === 0 && <p className="rounded-md border border-dashed border-line p-4 text-sm text-slate-500">No tasks</p>}
                  {tasksByStatus[status].map((task) => (
                    <article key={task.id} className="rounded-md border border-line p-4">
                      <div className="flex flex-wrap gap-2">
                        <PriorityBadge priority={task.priority} label={priorityLabels[task.priority]} />
                        {isOverdue(task.dueDate, task.status) && <Badge tone="danger">Overdue</Badge>}
                      </div>
                      <h4 className="mt-3 font-semibold">{task.title}</h4>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{task.description || "No description"}</p>
                      <p className="mt-3 text-xs text-slate-500">Assigned to {task.assignedTo?.name || "Unassigned"}</p>
                      <p className="mt-1 text-xs text-slate-500">Due {formatDate(task.dueDate)}</p>
                      <select value={task.status} onChange={(event) => updateTask(task.id, event.target.value as TaskStatus)} className="mt-3 w-full rounded-md border border-line px-2 py-2 text-sm outline-none focus:border-teal">
                        {statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
                      </select>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          {isAdmin && <TaskForm project={project} onDone={loadProject} />}
          {isAdmin && <MemberForm projectId={project.id} onDone={loadProject} />}
          <Members members={project.members} />
        </aside>
      </section>
    </Layout>
  );
}

function TaskForm({ project, onDone }: { project: Project; onDone: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/projects/${project.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          assignedToId: assignedToId || null,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null
        })
      });
      setTitle("");
      setDescription("");
      setAssignedToId("");
      setDueDate("");
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task");
    }
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h3 className="text-lg font-semibold">Create task</h3>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input required placeholder="Task title" value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal" />
        <textarea placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal" />
        <select value={assignedToId} onChange={(event) => setAssignedToId(event.target.value)} className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal">
          <option value="">Unassigned</option>
          {project.members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} className="rounded-md border border-line px-3 py-2 outline-none focus:border-teal">
            {priorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}
          </select>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="rounded-md border border-line px-3 py-2 outline-none focus:border-teal" />
        </div>
        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <button className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Add task</button>
      </form>
    </div>
  );
}

function MemberForm({ projectId, onDone }: { projectId: string; onDone: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("MEMBER");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ email, role })
      });
      setEmail("");
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add member");
    }
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h3 className="text-lg font-semibold">Add member</h3>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input required type="email" placeholder="teammate@email.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal" />
        <select value={role} onChange={(event) => setRole(event.target.value as ProjectRole)} className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal">
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <button className="w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">Add to project</button>
      </form>
    </div>
  );
}

function Members({ members }: { members: Project["members"] }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h3 className="text-lg font-semibold">Team</h3>
      <div className="mt-4 space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
            <div>
              <p className="font-medium">{member.user.name}</p>
              <p className="text-xs text-slate-500">{member.user.email}</p>
            </div>
            <Badge tone={member.role === "ADMIN" ? "admin" : "neutral"}>{member.role}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
