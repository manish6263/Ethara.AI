import { ProjectRole } from "@prisma/client";
import type { Request } from "express";
import { HttpError } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

export async function getMembership(req: Request, projectId: string) {
  if (!req.user) throw new HttpError(401, "Authentication required");

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: req.user.id
      }
    }
  });

  if (!membership) throw new HttpError(403, "You are not a member of this project");
  return membership;
}

export async function requireProjectMember(req: Request, projectId: string) {
  return getMembership(req, projectId);
}

export async function requireProjectAdmin(req: Request, projectId: string) {
  const membership = await getMembership(req, projectId);
  if (membership.role !== ProjectRole.ADMIN) {
    throw new HttpError(403, "Only project admins can perform this action");
  }
  return membership;
}
