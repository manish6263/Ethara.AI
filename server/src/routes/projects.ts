import { ProjectRole, TaskPriority, TaskStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError, routeParam } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireProjectAdmin, requireProjectMember } from "../middleware/rbac.js";

const router = Router();
router.use(requireAuth);

const projectSchema = z.object({
  name: z.string().trim().min(2).max(90),
  description: z.string().trim().max(500).optional().nullable()
});

const memberSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER)
});

const taskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().optional().nullable()
});

router.get("/", asyncHandler(async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: req.user!.id } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: { select: { id: true, status: true, dueDate: true } }
    },
    orderBy: { updatedAt: "desc" }
  });

  res.json({ projects });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = projectSchema.parse(req.body);
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      createdById: req.user!.id,
      members: {
        create: {
          userId: req.user!.id,
          role: ProjectRole.ADMIN
        }
      }
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: true
    }
  });

  res.status(201).json({ project });
}));

router.get("/:projectId", asyncHandler(async (req, res) => {
  const projectId = routeParam(req.params.projectId, "project id");
  await requireProjectMember(req, projectId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }]
      },
      tasks: {
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }]
      }
    }
  });

  if (!project) throw new HttpError(404, "Project not found");
  res.json({ project });
}));

router.patch("/:projectId", asyncHandler(async (req, res) => {
  const projectId = routeParam(req.params.projectId, "project id");
  await requireProjectAdmin(req, projectId);
  const input = projectSchema.partial().parse(req.body);
  const project = await prisma.project.update({
    where: { id: projectId },
    data: input
  });
  res.json({ project });
}));

router.delete("/:projectId", asyncHandler(async (req, res) => {
  const projectId = routeParam(req.params.projectId, "project id");
  await requireProjectAdmin(req, projectId);
  await prisma.project.delete({ where: { id: projectId } });
  res.json({ message: "Project deleted" });
}));

router.post("/:projectId/members", asyncHandler(async (req, res) => {
  const projectId = routeParam(req.params.projectId, "project id");
  await requireProjectAdmin(req, projectId);
  const input = memberSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new HttpError(404, "No user exists with that email");

  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: user.id } },
    update: { role: input.role },
    create: { projectId, userId: user.id, role: input.role },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  res.status(201).json({ member });
}));

router.patch("/:projectId/members/:memberId", asyncHandler(async (req, res) => {
  const projectId = routeParam(req.params.projectId, "project id");
  const memberId = routeParam(req.params.memberId, "member id");
  await requireProjectAdmin(req, projectId);
  const input = z.object({ role: z.nativeEnum(ProjectRole) }).parse(req.body);
  const member = await prisma.projectMember.update({
    where: { id: memberId },
    data: { role: input.role },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  res.json({ member });
}));

router.delete("/:projectId/members/:memberId", asyncHandler(async (req, res) => {
  const projectId = routeParam(req.params.projectId, "project id");
  const memberId = routeParam(req.params.memberId, "member id");
  await requireProjectAdmin(req, projectId);
  const adminCount = await prisma.projectMember.count({
    where: { projectId, role: ProjectRole.ADMIN }
  });
  const member = await prisma.projectMember.findUnique({ where: { id: memberId } });
  if (member?.role === ProjectRole.ADMIN && adminCount <= 1) {
    throw new HttpError(400, "A project must keep at least one admin");
  }
  await prisma.projectMember.delete({ where: { id: memberId } });
  res.json({ message: "Member removed" });
}));

router.post("/:projectId/tasks", asyncHandler(async (req, res) => {
  const projectId = routeParam(req.params.projectId, "project id");
  await requireProjectAdmin(req, projectId);
  const input = taskSchema.parse(req.body);

  if (input.assignedToId) {
    const assignee = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: input.assignedToId } }
    });
    if (!assignee) throw new HttpError(400, "Assignee must be a project member");
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      createdById: req.user!.id,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      assignedToId: input.assignedToId
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });

  res.status(201).json({ task });
}));

export default router;
