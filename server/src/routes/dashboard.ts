import { TaskStatus } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  const now = new Date();
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: req.user!.id } } },
    include: {
      members: true,
      tasks: {
        include: {
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } }
        },
        orderBy: { dueDate: "asc" }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const tasks = projects.flatMap((project) => project.tasks);
  const myTasks = tasks.filter((task) => task.assignedToId === req.user!.id);
  const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < now && task.status !== TaskStatus.DONE);
  const statusCounts = Object.fromEntries(
    Object.values(TaskStatus).map((status) => [status, tasks.filter((task) => task.status === status).length])
  );

  res.json({
    stats: {
      projectCount: projects.length,
      taskCount: tasks.length,
      myTaskCount: myTasks.length,
      overdueCount: overdueTasks.length,
      doneCount: statusCounts.DONE ?? 0
    },
    statusCounts,
    projects,
    myTasks: myTasks.slice(0, 8),
    overdueTasks: overdueTasks.slice(0, 8)
  });
}));

export default router;
