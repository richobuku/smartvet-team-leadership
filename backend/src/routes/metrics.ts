import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/team/:teamId", async (req, res) => {
  const metrics = await prisma.metric.findMany({ where: { teamId: req.params.teamId } });
  res.json(metrics);
});

router.get("/:id", async (req, res) => {
  const metric = await prisma.metric.findUnique({ where: { id: req.params.id } });
  if (!metric) return res.status(404).json({ error: "Not found" });
  res.json(metric);
});

router.post("/", requireRole("admin", "executive", "team_leader"), async (req, res) => {
  const { name, description, teamId, frequency, target, unit, calculation, greenThreshold, yellowThreshold, dataSource } = req.body;
  if (!name || !teamId || !frequency || target == null || !unit) {
    return res.status(400).json({ error: "name, teamId, frequency, target, unit are required" });
  }
  const metric = await prisma.metric.create({
    data: { name, description, teamId, frequency, target, unit, calculation, greenThreshold, yellowThreshold, dataSource },
  });
  res.status(201).json(metric);
});

router.put("/:id", requireRole("admin", "executive", "team_leader"), async (req, res) => {
  const existing = await prisma.metric.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (req.user!.role === "team_leader" && existing.teamId !== req.user!.teamId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { name, description, frequency, target, unit, calculation, greenThreshold, yellowThreshold, dataSource } = req.body;
  const metric = await prisma.metric.update({
    where: { id: req.params.id },
    data: { name, description, frequency, target, unit, calculation, greenThreshold, yellowThreshold, dataSource },
  });
  res.json(metric);
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.metric.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// MetricDatapoints
router.get("/:id/datapoints/:userId", async (req, res) => {
  const datapoints = await prisma.metricDatapoint.findMany({
    where: { metricId: req.params.id, userId: req.params.userId },
    orderBy: { date: "asc" },
  });
  res.json(datapoints);
});

router.post("/:id/datapoints", async (req, res) => {
  const { userId, date, value, notes } = req.body;
  if (!userId || !date || value == null) {
    return res.status(400).json({ error: "userId, date, value are required" });
  }
  const datapoint = await prisma.metricDatapoint.create({
    data: {
      metricId: req.params.id,
      userId,
      date: new Date(date),
      value,
      notes,
      submittedById: req.user!.id,
    },
  });
  res.status(201).json(datapoint);
});

export default router;
