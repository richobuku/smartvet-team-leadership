import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { calcStatus, overallStatus } from "../lib/status";

const router = Router();
router.use(requireAuth);

async function checkUserAccess(req: any, targetId: string): Promise<boolean> {
  const role = req.user!.role;
  if (req.user!.id === targetId || role === "admin" || role === "executive") return true;
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  return !!target && target.managerId === req.user!.id;
}

// Get a user's weekly dashboard for a given week (week = Monday date, ISO string)
router.get("/weekly/:userId/:week", async (req, res) => {
  if (!(await checkUserAccess(req, req.params.userId))) return res.status(403).json({ error: "Forbidden" });
  const week = new Date(req.params.week);
  const dashboard = await prisma.weeklyDashboard.findUnique({
    where: { userId_week: { userId: req.params.userId, week } },
    include: { metrics: { include: { metric: true } } },
  });
  res.json(dashboard);
});

// Get all weekly dashboards for a user (history)
router.get("/weekly/:userId", async (req, res) => {
  if (!(await checkUserAccess(req, req.params.userId))) return res.status(403).json({ error: "Forbidden" });
  const dashboards = await prisma.weeklyDashboard.findMany({
    where: { userId: req.params.userId },
    include: { metrics: { include: { metric: true } } },
    orderBy: { week: "desc" },
    take: 12,
  });
  res.json(dashboards);
});

// List all team members' weekly dashboards for a given week (for leader review)
router.get("/weekly/team/:teamId/:week", async (req, res) => {
  const role = req.user!.role;
  const isAdmin = role === "admin" || role === "executive";
  if (!isAdmin && req.user!.teamId !== req.params.teamId) return res.status(403).json({ error: "Forbidden" });
  const week = new Date(req.params.week);
  const members = await prisma.user.findMany({
    where: { teamId: req.params.teamId, role: "team_member" },
  });
  const dashboards = await prisma.weeklyDashboard.findMany({
    where: { userId: { in: members.map((m) => m.id) }, week },
    include: { metrics: { include: { metric: true } }, user: { select: { id: true, name: true } } },
  });
  res.json({ members, dashboards });
});

// Create or update (upsert) a weekly dashboard - manager submits actuals during weekly review
router.post("/weekly", async (req, res) => {
  const { userId, week, metrics, biggestWin, biggestBlocker, managerReviewNotes, submitted } = req.body;
  if (!userId || !week || !Array.isArray(metrics)) {
    return res.status(400).json({ error: "userId, week, metrics[] are required" });
  }

  if (!(await checkUserAccess(req, userId))) return res.status(403).json({ error: "Forbidden" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const weekDate = new Date(week);
  const computedMetrics: { metricId: string; target: number; actual: number; status: "green" | "yellow" | "red" }[] = [];

  const metricRecords = await prisma.metric.findMany({
    where: { id: { in: metrics.map((m: any) => m.metricId) } },
  });
  const metricById = new Map(metricRecords.map((m) => [m.id, m]));

  for (const m of metrics) {
    const metric = metricById.get(m.metricId);
    if (!metric) continue;
    const status = calcStatus(m.actual, m.target ?? metric.target, metric.greenThreshold, metric.yellowThreshold);
    computedMetrics.push({ metricId: m.metricId, target: m.target ?? metric.target, actual: m.actual, status });
  }

  const overall = overallStatus(computedMetrics.map((m) => m.status));

  const existing = await prisma.weeklyDashboard.findUnique({
    where: { userId_week: { userId, week: weekDate } },
  });

  let dashboard;
  if (existing) {
    await prisma.weeklyDashboardMetric.deleteMany({ where: { dashboardId: existing.id } });
    dashboard = await prisma.weeklyDashboard.update({
      where: { id: existing.id },
      data: {
        overallStatus: overall,
        biggestWin,
        biggestBlocker,
        managerReviewNotes,
        submittedAt: submitted ? new Date() : existing.submittedAt,
        metrics: { create: computedMetrics },
      },
      include: { metrics: { include: { metric: true } } },
    });
  } else {
    dashboard = await prisma.weeklyDashboard.create({
      data: {
        userId,
        managerId: user.managerId || req.user!.id,
        week: weekDate,
        overallStatus: overall,
        biggestWin,
        biggestBlocker,
        managerReviewNotes,
        submittedAt: submitted ? new Date() : null,
        metrics: { create: computedMetrics },
      },
      include: { metrics: { include: { metric: true } } },
    });
  }

  // Churn risk: red overall status for 2+ consecutive weeks -> high
  const recent = await prisma.weeklyDashboard.findMany({
    where: { userId },
    orderBy: { week: "desc" },
    take: 2,
  });
  if (recent.length >= 2 && recent.every((d) => d.overallStatus === "red")) {
    await prisma.user.update({ where: { id: userId }, data: { churnRisk: "high" } });
  } else if (overall !== "red" && user.churnRisk === "high") {
    await prisma.user.update({ where: { id: userId }, data: { churnRisk: "low" } });
  }

  res.status(existing ? 200 : 201).json(dashboard);
});

export default router;
