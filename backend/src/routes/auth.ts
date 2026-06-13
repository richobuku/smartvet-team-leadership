import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken, requireAuth, requireRole } from "../middleware/auth";
import { sendVerificationEmail } from "../lib/verificationEmail";

const router = Router();

const VERIFICATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  if (!user.emailVerified) {
    return res.status(403).json({ error: "Please verify your email before logging in. Check your inbox for the verification link." });
  }

  const token = signToken({ id: user.id, role: user.role, teamId: user.teamId });
  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.post("/register", requireAuth, requireRole("admin"), async (req, res) => {
  const { name, email, password, role, teamId, managerId, weeklyTarget } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password, role are required" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, teamId, managerId, weeklyTarget, verificationToken, verificationTokenExpiry },
  });

  sendVerificationEmail(user.email, user.name, verificationToken).catch(() => {});

  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json(safeUser);
});

router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token is required" });

  const user = await prisma.user.findUnique({ where: { verificationToken: token } });
  if (!user) return res.status(400).json({ error: "Invalid or expired verification link" });
  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    return res.status(400).json({ error: "Verification link has expired. Ask an admin to resend it." });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null, verificationTokenExpiry: null },
  });

  res.json({ ok: true });
});

router.post("/resend-verification", requireAuth, requireRole("admin"), async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "Not found" });
  if (user.emailVerified) return res.status(400).json({ error: "User is already verified" });

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  await prisma.user.update({ where: { id: user.id }, data: { verificationToken, verificationTokenExpiry } });

  sendVerificationEmail(user.email, user.name, verificationToken).catch(() => {});

  res.json({ ok: true });
});

export default router;
