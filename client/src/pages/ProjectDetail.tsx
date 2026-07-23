import { Loader2, UserX } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Badge, PriorityBadge } from "../components/Badge";
import { useConfirm } from "../components/ConfirmDialog";
import { Layout } from "../components/Layout";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { formatDate, isOverdue, priorityLabels, statusLabels } from "../lib/format";
import type { Project, ProjectRole, Task, TaskPriority, TaskStatus } from "../types";

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

export function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

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
    setUpdatingTaskId(taskId);
    try {
      await api<{ task: Task }>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadProject();
      toast.success(`Moved to ${statusLabels[status]}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update task";
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
    project?.tasks.forEach((task) => grouped[task.status].push(task));
    return grouped;
  }, [project]);

  if (error && !project) return <Layout><p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p></Layout>;
  if (!project) return <Layout><div className="h-72 animate-pulse rounded-lg bg-white" /></Layout>;

  function canDrag(task: Task) {
    return Boolean(isAdmin || task.assignedTo?.id === user?.id);
  }

  function onColumnDrop(status: TaskStatus) {
    setDragOverStatus(null);
    if (!dragTaskId) return;
    const task = project?.tasks.find((item) => item.id === dragTaskId);
    setDragTaskId(null);
    if (!task || task.status === status) return;
    updateTask(task.id, status);
  }

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
              <div
                key={status}
                onDragOver={(event) => {
                  if (!dragTaskId) return;
                  event.preventDefault();
                  setDragOverStatus(status);
                }}
                onDragLeave={() => setDragOverStatus((current) => (current === status ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  onColumnDrop(status);
                }}
                className={`rounded-lg border bg-white p-4 shadow-soft transition-colors ${
                  dragOverStatus === status ? "border-teal bg-teal-50/40 ring-2 ring-teal/30" : "border-line"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{statusLabels[status]}</h3>
                  <span className="text-sm text-slate-500">{tasksByStatus[status].length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {tasksByStatus[status].length === 0 && (
                    <p className="rounded-md border border-dashed border-line p-4 text-sm text-slate-500">
                      {dragOverStatus === status ? "Drop here" : "No tasks"}
                    </p>
                  )}
                  {tasksByStatus[status].map((task) => {
                    const draggable = canDrag(task);
                    const isUpdating = updatingTaskId === task.id;
                    return (
                      <article
                        key={task.id}
                        draggable={draggable}
                        onDragStart={(event) => {
                          setDragTaskId(task.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDragTaskId(null);
                          setDragOverStatus(null);
                        }}
                        className={`rounded-md border border-line p-4 transition-all ${
                          draggable ? "cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:border-teal hover:shadow-soft" : ""
                        } ${dragTaskId === task.id ? "opacity-40" : ""} ${isUpdating ? "animate-pulse" : ""}`}
                      >
                        <div className="flex flex-wrap gap-2">
                          <PriorityBadge priority={task.priority} label={priorityLabels[task.priority]} />
                          {isOverdue(task.dueDate, task.status) && <Badge tone="danger">Overdue</Badge>}
                        </div>
                        <h4 className="mt-3 font-semibold">{task.title}</h4>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{task.description || "No description"}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Avatar name={task.assignedTo?.name || "Unassigned"} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-600">{task.assignedTo?.name || "Unassigned"}</p>
                            <p className="text-xs text-slate-500">Due {formatDate(task.dueDate)}</p>
                          </div>
                        </div>
                        <select
                          value={task.status}
                          disabled={!draggable || isUpdating}
                          title={draggable ? "Update task status (or drag the card between columns)" : "Only admins or the assigned member can update this task"}
                          onChange={(event) => updateTask(task.id, event.target.value as TaskStatus)}
                          className="mt-3 w-full rounded-md border border-line px-2 py-2 text-sm outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
                        </select>
                        {!draggable && <p className="mt-2 text-xs text-slate-500">Only admins or the assigned member can update this status.</p>}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          {isAdmin && <TaskForm project={project} onDone={loadProject} />}
          {isAdmin && <MemberForm projectId={project.id} onDone={loadProject} />}
          <Members projectId={project.id} members={project.members} canManage={Boolean(isAdmin)} onDone={loadProject} />
        </aside>
      </section>
    </Layout>
  );
}

function TaskForm({ project, onDone }: { project: Project; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
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
      toast.success(`Task "${title}" created`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create task";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h3 className="text-lg font-semibold">Create task</h3>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          required
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-line px-3 py-2 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-line px-3 py-2 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
        <select
          value={assignedToId}
          onChange={(event) => setAssignedToId(event.target.value)}
          className="w-full rounded-md border border-line px-3 py-2 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20"
        >
          <option value="">Unassigned</option>
          {project.members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="rounded-md border border-line px-3 py-2 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20"
          >
            {priorities.map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="rounded-md border border-line px-3 py-2 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20"
          />
        </div>
        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <button
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Adding..." : "Add task"}
        </button>
      </form>
    </div>
  );
}

function MemberForm({ projectId, onDone }: { projectId: string; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("MEMBER");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ email, role })
      });
      toast.success(`${email} added to the project`);
      setEmail("");
      await onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not add member";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h3 className="text-lg font-semibold">Add member</h3>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          required
          type="email"
          placeholder="teammate@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-line px-3 py-2 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as ProjectRole)}
          className="w-full rounded-md border border-line px-3 py-2 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <button
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Adding..." : "Add to project"}
        </button>
      </form>
    </div>
  );
}

function Members({
  projectId,
  members,
  canManage,
  onDone
}: {
  projectId: string;
  members: Project["members"];
  canManage: boolean;
  onDone: () => Promise<void>;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [error, setError] = useState("");
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const adminCount = members.filter((member) => member.role === "ADMIN").length;

  async function updateRole(memberId: string, role: ProjectRole) {
    setError("");
    setBusyMemberId(memberId);
    try {
      await api(`/api/projects/${projectId}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role })
      });
      await onDone();
      toast.success(`Role updated to ${role === "ADMIN" ? "Admin" : "Member"}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update member role";
      setError(message);
      toast.error(message);
    } finally {
      setBusyMemberId(null);
    }
  }

  async function removeMember(memberId: string, name: string) {
    const confirmed = await confirm({
      title: `Remove ${name}?`,
      message: "They will lose access to this project's tasks immediately.",
      confirmLabel: "Remove",
      tone: "danger"
    });
    if (!confirmed) return;
    setError("");
    setBusyMemberId(memberId);
    try {
      await api(`/api/projects/${projectId}/members/${memberId}`, { method: "DELETE" });
      await onDone();
      toast.success(`${name} removed from the project`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not remove member";
      setError(message);
      toast.error(message);
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h3 className="text-lg font-semibold">Team</h3>
      {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 space-y-3">
        {members.map((member) => {
          const locked = member.role === "ADMIN" && adminCount <= 1;
          const busy = busyMemberId === member.id;
          return (
            <div key={member.id} className="rounded-md border border-line p-3 transition-colors hover:border-teal/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={member.user.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.user.name}</p>
                    <p className="truncate text-xs text-slate-500">{member.user.email}</p>
                  </div>
                </div>
                <Badge tone={member.role === "ADMIN" ? "admin" : "neutral"}>{member.role}</Badge>
              </div>
              {canManage && (
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <select
                    value={member.role}
                    disabled={locked || busy}
                    title={locked ? "A project must keep at least one admin" : "Change project role"}
                    onChange={(event) => updateRole(member.id, event.target.value as ProjectRole)}
                    className="rounded-md border border-line px-2 py-2 text-sm outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    disabled={locked || busy}
                    onClick={() => removeMember(member.id, member.user.name)}
                    title={locked ? "A project must keep at least one admin" : "Remove member"}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:border-line disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-slate-100"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
