export type User = {
  id: string;
  name: string;
  email: string;
};

export type ProjectRole = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type ProjectMember = {
  id: string;
  role: ProjectRole;
  user: User;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assignedTo?: User | null;
  assignedToId?: string | null;
  createdBy?: User;
  project?: Pick<Project, "id" | "name">;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  tasks: Task[];
};

export type DashboardPayload = {
  stats: {
    projectCount: number;
    taskCount: number;
    myTaskCount: number;
    overdueCount: number;
    doneCount: number;
  };
  statusCounts: Record<TaskStatus, number>;
  projects: Project[];
  myTasks: Task[];
  overdueTasks: Task[];
};
