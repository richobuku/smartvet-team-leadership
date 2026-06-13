import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Company-wide celebrations (visibility = company)
router.get("/company", async (req, res) => {
  const logs = await prisma.celebrationLog.findMany({
    where: { visibility: "company" },
    include: { user: { select: { id: true, name: true, teamId: true } }, manager: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });
  res.json(logs);
});

// All celebrations visible to a team (team + company visibility, for members of that team)
router.get("/team/:teamId", async (req, res) => {
  const members = await prisma.user.findMany({ where: { teamId: req.params.teamId }, select: { id: true } });
  const memberIds = members.map((m) => m.id);
  const logs = await prisma.celebrationLog.findMany({
    where: { OR: [{ visibility: "company" }, { userId: { in: memberIds } }] },
    include: { user: { select: { id: true, name: true, teamId: true } }, manager: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });
  res.json(logs);
});

router.post("/", async (req, res) => {
  const { userId, achievement, impact, visibility, notes, date } = req.body;
  if (!userId || !achievement) return res.status(400).json({ error: "userId and achievement are required" });
  const log = await prisma.celebrationLog.create({
    data: {
      userId,
      managerId: req.user!.id,
      achievement,
      impact,
      visibility: visibility || "team",
      notes,
      date: date ? new Date(date) : new Date(),
    },
  });
  res.status(201).json(log);
});

export default router;
