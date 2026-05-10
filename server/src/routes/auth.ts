import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { cookieOptions, signToken } from "../lib/auth.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const authSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const signupSchema = authSchema.extend({
  name: z.string().trim().min(2).max(80)
});

const publicUser = {
  id: true,
  name: true,
  email: true,
  createdAt: true
};

router.post("/signup", asyncHandler(async (req, res) => {
  const input = signupSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: publicUser
  });

  res.cookie("token", signToken({ userId: user.id }), cookieOptions());
  res.status(201).json({ user });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const input = authSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new HttpError(401, "Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid email or password");

  res.cookie("token", signToken({ userId: user.id }), cookieOptions());
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }
  });
}));

router.post("/logout", (_req, res) => {
  res.clearCookie("token", cookieOptions());
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

export default router;
