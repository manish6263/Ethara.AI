import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Badge } from "../components/Badge";
import { api } from "../lib/api";
import type { Project } from "../types";

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ projects: Project[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api<{ project: Project }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, description })
      });
      navigate(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
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
            {projects.map((project) => {
              const done = project.tasks.filter((task) => task.status === "DONE").length;
              const percent = project.tasks.length ? Math.round((done / project.tasks.length) * 100) : 0;
              return (
                <Link key={project.id} to={`/projects/${project.id}`} className="rounded-lg border border-line bg-white p-5 shadow-soft hover:border-teal">
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
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-teal" style={{ width: `${percent}%` }} />
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
              <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="mt-1 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal" />
            </label>
            <button className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Create project</button>
          </form>
        </aside>
      </div>
    </Layout>
  );
}
