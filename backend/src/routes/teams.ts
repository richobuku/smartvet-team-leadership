import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const teams = await prisma.team.findMany({
    include: {
      leader: { select: { id: true, name: true } },
      members: { select: { id: true, name: true, role: true, status: true, churnRisk: true } },
      metrics: true,
    },
  });
  res.json(teams);
});

router.get("/:id", async (req, res) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id },
    include: {
      leader: { select: { id: true, name: true } },
      members: { select: { id: true, name: true, role: true, status: true, churnRisk: true, weeklyTarget: true } },
      metrics: true,
      frameworks: true,
    },
  });
  if (!team) return res.status(404).json({ error: "Not found" });
  res.json(team);
});

router.get("/:id/members", async (req, res) => {
  const members = await prisma.user.findMany({
    where: { teamId: req.params.id },
    select: { id: true, name: true, email: true, role: true, status: true, churnRisk: true, weeklyTarget: true, promotionTrack: true },
  });
  res.json(members);
});

router.post("/", requireRole("admin"), async (req, res) => {
  const { name, description, leaderId } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const team = await prisma.team.create({ data: { name, description, leaderId } });
  res.status(201).json(team);
});

router.put("/:id", requireRole("admin"), async (req, res) => {
  const { name, description, leaderId } = req.body;
  const team = await prisma.team.update({
    where: { id: req.params.id },
    data: { name, description, leaderId },
  });
  res.json(team);
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.team.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
