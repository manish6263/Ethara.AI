import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/auth.js";
import { HttpError } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token;
    if (!token) throw new HttpError(401, "Authentication required");

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) throw new HttpError(401, "Invalid session");
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid session"));
  }
}
