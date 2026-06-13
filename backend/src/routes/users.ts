import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function sanitize(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

router.get("/me", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { team: true },
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(sanitize(user));
});

router.get("/", requireRole("admin", "executive"), async (req, res) => {
  const users = await prisma.user.findMany({ include: { team: true } });
  res.json(users.map(sanitize));
});

router.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { team: true },
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(sanitize(user));
});

router.put("/:id", async (req, res) => {
  const isSelf = req.user!.id === req.params.id;
  const isAdmin = req.user!.role === "admin";
  if (!isSelf && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const allowedFields = isAdmin
    ? ["name", "phone", "teamId", "managerId", "weeklyTarget", "role", "promotionTrack", "churnRisk", "status", "employmentType"]
    : ["name", "phone"];

  const data: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in req.body) data[field] = req.body[field];
  }
  if (req.body.password && isAdmin) {
    data.passwordHash = await bcrypt.hash(req.body.password, 10);
  }

  const user = await prisma.user.update({ where: { id: req.params.id }, data });
  res.json(sanitize(user));
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
