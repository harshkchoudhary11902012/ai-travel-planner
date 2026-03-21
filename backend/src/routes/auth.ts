import type { Request, Response } from "express";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { User } from "../models";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret";
}

function sendError(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

router.post("/signup", async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "Invalid email or password");

  try {
    const email = parsed.data.email.toLowerCase();
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 409, "Email already registered");

    const user = await User.create({
      email,
      passwordHash,
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
    });
    const u = user.toObject();
    delete (u as Record<string, unknown>).passwordHash;
    return res.status(201).json({ user: u });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    return sendError(res, 500, "Sign up failed");
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "Email and password required");

  try {
    const email = parsed.data.email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return sendError(res, 401, "Invalid email or password");

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) return sendError(res, 401, "Invalid email or password");

    const token = jwt.sign(
      { userId: user._id.toString() },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    return res.json({ token });
  } catch (err: unknown) {
    console.error("Login error:", err);
    return sendError(res, 500, "Login failed");
  }
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = req.userId;
    if (!uid) return sendError(res, 401, "Unauthorized");

    const user = await User.findById(uid).select("-passwordHash");
    if (!user) return sendError(res, 401, "User not found");

    return res.json({ user });
  } catch (err: unknown) {
    console.error("Me error:", err);
    return sendError(res, 500, "Failed to fetch user");
  }
});

export default router;

