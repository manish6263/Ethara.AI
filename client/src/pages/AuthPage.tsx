import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (mode === "signup") await signup(name, email, password);
      else await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-mist lg:grid-cols-[1fr_480px]">
      <section className="hidden border-r border-line bg-ink px-14 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">Ethara.AI Assessment</p>
          <h1 className="mt-6 max-w-xl text-5xl font-bold leading-tight">Operational clarity for every project, task, and team handoff.</h1>
          <p className="mt-6 max-w-lg text-lg text-slate-300">
            A production-ready task manager with role-based project access, assignment workflows, and status dashboards.
          </p>
        </div>
        <div className="grid max-w-2xl grid-cols-3 gap-4">
          {["Admin controls", "Member updates", "Overdue tracking"].map((item) => (
            <div key={item} className="rounded-lg border border-white/15 bg-white/5 p-4 text-sm text-slate-200">{item}</div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-line bg-white p-7 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">TaskFlow</p>
          <h2 className="mt-2 text-3xl font-bold">{mode === "signup" ? "Create account" : "Welcome back"}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "signup"
              ? "Create your workspace account, then create a project or ask an admin to add you."
              : "Login with your account to manage projects, tasks, and team progress."}
          </p>

          <div className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="text-sm font-medium">Name</span>
                <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal" />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-teal" />
            </label>
          </div>

          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button disabled={submitting} className="mt-6 w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {submitting ? "Please wait..." : mode === "signup" ? "Sign up" : "Login"}
          </button>

          <button type="button" onClick={() => navigate(mode === "signup" ? "/login" : "/signup")} className="mt-4 w-full text-sm font-medium text-teal hover:underline">
            {mode === "signup" ? "Already have an account? Login" : "Need an account? Sign up"}
          </button>
        </form>
      </section>
    </div>
  );
}
