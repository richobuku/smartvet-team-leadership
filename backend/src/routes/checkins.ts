import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Team member submits their own daily check-in
router.post("/", async (req, res) => {
  const { bigWin, blocker, needsHelp, notes, date } = req.body;
  const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!me || !me.managerId) {
    return res.status(400).json({ error: "User has no manager assigned" });
  }
  const checkin = await prisma.dailyCheckIn.create({
    data: {
      userId: me.id,
      managerId: me.managerId,
      date: date ? new Date(date) : new Date(),
      bigWin,
      blocker,
      needsHelp: !!needsHelp,
      notes,
    },
  });
  res.status(201).json(checkin);
});

// History for a specific user
router.get("/user/:userId", async (req, res) => {
  const role = req.user!.role;
  const isAdmin = role === "admin" || role === "executive";
  if (!isAdmin && req.user!.id !== req.params.userId) {
    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target || target.managerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  }
  const checkins = await prisma.dailyCheckIn.findMany({
    where: { userId: req.params.userId },
    orderBy: { date: "desc" },
    take: 30,
  });
  res.json(checkins);
});

// Feed for a manager (today by default)
router.get("/manager/:managerId", async (req, res) => {
  const role = req.user!.role;
  const isAdmin = role === "admin" || role === "executive";
  if (!isAdmin && req.user!.id !== req.params.managerId) return res.status(403).json({ error: "Forbidden" });
  const { from } = req.query;
  const where: any = { managerId: req.params.managerId };
  if (from) {
    where.date = { gte: new Date(from as string) };
  }
  const checkins = await prisma.dailyCheckIn.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
  res.json(checkins);
});

export default router;
