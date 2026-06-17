import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  emailVerified: true,
  role: true,
  teamId: true,
  team: true,
  managerId: true,
  weeklyTarget: true,
  promotionTrack: true,
  churnRisk: true,
  status: true,
  employmentType: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
};

router.get("/me", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: userSelect,
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

router.get("/", requireRole("admin", "executive", "hr_manager"), async (req, res) => {
  const users = await prisma.user.findMany({ select: userSelect });
  res.json(users);
});

router.get("/:id", async (req, res) => {
  const isSelf = req.user!.id === req.params.id;
  const isHr = ["admin", "executive", "hr_manager"].includes(req.user!.role);
  if (!isSelf && !isHr) return res.status(403).json({ error: "Forbidden" });

  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: userSelect,
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
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

  if (req.body.password) {
    if (isAdmin) {
      data.passwordHash = await bcrypt.hash(req.body.password, 10);
    } else {
      const current = await prisma.user.findUnique({ where: { id: req.params.id }, select: { passwordHash: true } });
      if (!current || !(await bcrypt.compare(req.body.currentPassword || "", current.passwordHash))) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      data.passwordHash = await bcrypt.hash(req.body.password, 10);
    }
  }

  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: userSelect });
  res.json(user);
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
