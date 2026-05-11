import { BarChart3, FolderKanban, LogOut, PlusCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-5 py-6 lg:block">
        <Link to="/dashboard" className="block">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Ethara.AI</p>
          <h1 className="mt-1 text-2xl font-bold">TaskFlow</h1>
        </Link>
        <nav className="mt-8 space-y-2">
          <NavItem to="/dashboard" icon={<BarChart3 size={18} />} label="Dashboard" />
          <NavItem to="/projects" icon={<FolderKanban size={18} />} label="Projects" />
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-line bg-mist p-4">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <button onClick={onLogout} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link to="/dashboard" className="min-w-0 lg:hidden">
              <span className="block font-bold">TaskFlow</span>
              <span className="block max-w-[150px] truncate text-xs text-slate-500">{user?.name || user?.email}</span>
            </Link>
            <div className="hidden text-sm text-slate-500 lg:block">Team task manager with project-level roles</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 lg:hidden">
                <MobileNavButton to="/dashboard" label="Dashboard" icon={<BarChart3 size={18} />} />
                <MobileNavButton to="/projects" label="Projects" icon={<FolderKanban size={18} />} />
                <button
                  onClick={onLogout}
                  aria-label="Logout"
                  title="Logout"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-slate-600 hover:bg-slate-50"
                >
                  <LogOut size={18} />
                </button>
              </div>
              <Link to="/projects" className="hidden items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:inline-flex">
                <PlusCircle size={16} /> New work
              </Link>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function MobileNavButton({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        `inline-flex h-9 w-9 items-center justify-center rounded-md border border-line ${
          isActive ? "bg-ink text-white" : "bg-white text-slate-600 hover:bg-slate-50"
        }`
      }
    >
      {icon}
    </NavLink>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-ink text-white" : "text-slate-600 hover:bg-mist"}`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
