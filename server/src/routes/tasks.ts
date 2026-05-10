import { ProjectRole, TaskPriority, TaskStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError, routeParam } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireProjectMember } from "../middleware/rbac.js";

const router = Router();
router.use(requireAuth);

const updateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().optional().nullable()
});

router.get("/:taskId", asyncHandler(async (req, res) => {
  const taskId = routeParam(req.params.taskId, "task id");
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });
  if (!task) throw new HttpError(404, "Task not found");
  await requireProjectMember(req, task.projectId);
  res.json({ task });
}));

router.patch("/:taskId", asyncHandler(async (req, res) => {
  const taskId = routeParam(req.params.taskId, "task id");
  const input = updateSchema.parse(req.body);
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new HttpError(404, "Task not found");

  const membership = await requireProjectMember(req, task.projectId);
  const isAdmin = membership.role === ProjectRole.ADMIN;
  const isAssignee = task.assignedToId === req.user!.id;

  if (!isAdmin && !isAssignee) {
    throw new HttpError(403, "Members can update only tasks assigned to them");
  }

  const data = isAdmin
    ? {
        ...input,
        dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null
      }
    : { status: input.status };

  if (isAdmin && input.assignedToId) {
    const assignee = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: input.assignedToId } }
    });
    if (!assignee) throw new HttpError(400, "Assignee must be a project member");
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });

  res.json({ task: updated });
}));

router.delete("/:taskId", asyncHandler(async (req, res) => {
  const taskId = routeParam(req.params.taskId, "task id");
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new HttpError(404, "Task not found");
  const membership = await requireProjectMember(req, task.projectId);
  if (membership.role !== ProjectRole.ADMIN) {
    throw new HttpError(403, "Only project admins can delete tasks");
  }
  await prisma.task.delete({ where: { id: taskId } });
  res.json({ message: "Task deleted" });
}));

export default router;
