import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Badge } from "../components/Badge";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import type { Project } from "../types";

export function Projects() {
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ projects: Project[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await api<{ project: Project }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, description })
      });
      toast.success(`"${data.project.name}" created`);
      navigate(`/projects/${data.project.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create project";
      setError(message);
      toast.error(message);
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Workspace</p>
          <h2 className="mt-1 text-3xl font-bold">Projects</h2>
          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {loading && [1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-lg bg-white" />)}
            {!loading && projects.length === 0 && (
              <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center md:col-span-2">
                <p className="text-lg font-semibold text-ink">No projects yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Create a project to become its admin, or ask another admin to add your signed-up email to their project.
                </p>
              </div>
            )}
            {projects.map((project, index) => {
              const done = project.tasks.filter((task) => task.status === "DONE").length;
              const percent = project.tasks.length ? Math.round((done / project.tasks.length) * 100) : 0;
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className="animate-fade-in-up rounded-lg border border-line bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-teal hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{project.description || "No description"}</p>
                    </div>
                    <Badge>{project.members.length} members</Badge>
                  </div>
                  <div className="mt-5">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-semibold">{percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-teal transition-[width] duration-700 ease-out" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h3 className="text-lg font-semibold">Create project</h3>
          <form onSubmit={createProject} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Project name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20"
              />
            </label>
            <button
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Creating..." : "Create project"}
            </button>
          </form>
        </aside>
      </div>
    </Layout>
  );
}
