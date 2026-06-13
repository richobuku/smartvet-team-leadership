import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { calcStatus } from "../lib/status";

const router = Router();
router.use(requireAuth);

async function checkUserAccess(req: any, targetId: string): Promise<boolean> {
  const role = req.user!.role;
  if (req.user!.id === targetId || role === "admin" || role === "executive") return true;
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  return !!target && target.managerId === req.user!.id;
}

router.get("/monthly/:userId/:month", async (req, res) => {
  if (!(await checkUserAccess(req, req.params.userId))) return res.status(403).json({ error: "Forbidden" });
  const month = new Date(req.params.month);
  const scorecard = await prisma.monthlyScorecard.findUnique({
    where: { userId_month: { userId: req.params.userId, month } },
    include: { kpis: { include: { metric: true } } },
  });
  res.json(scorecard);
});

router.get("/monthly/:userId", async (req, res) => {
  if (!(await checkUserAccess(req, req.params.userId))) return res.status(403).json({ error: "Forbidden" });
  const scorecards = await prisma.monthlyScorecard.findMany({
    where: { userId: req.params.userId },
    include: { kpis: { include: { metric: true } } },
    orderBy: { month: "desc" },
  });
  res.json(scorecards);
});

// Manager creates/updates the scorecard template, auto-pulling KPIs from the team's evaluation framework
router.post("/monthly", async (req, res) => {
  const { userId, month, kpis, wins, blockers, pivots, nextMonthStrategy, managerFeedback, selfReflection, goNoGo, submitted } = req.body;
  if (!userId || !month) return res.status(400).json({ error: "userId and month are required" });

  if (!(await checkUserAccess(req, userId))) return res.status(403).json({ error: "Forbidden" });

  const monthDate = new Date(month);
  const existing = await prisma.monthlyScorecard.findUnique({
    where: { userId_month: { userId, month: monthDate } },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  let kpiData: { metricId: string; target: number; actual: number; status: "green" | "yellow" | "red"; notes?: string }[] | undefined;
  if (Array.isArray(kpis)) {
    const metricRecords = await prisma.metric.findMany({
      where: { id: { in: kpis.map((k: any) => k.metricId) } },
    });
    const metricById = new Map(metricRecords.map((m) => [m.id, m]));
    kpiData = [];
    for (const k of kpis) {
      const metric = metricById.get(k.metricId);
      if (!metric) continue;
      const status = calcStatus(k.actual, k.target ?? metric.target, metric.greenThreshold, metric.yellowThreshold);
      kpiData.push({ metricId: k.metricId, target: k.target ?? metric.target, actual: k.actual, status, notes: k.notes });
    }
  }

  const data: any = {
    wins,
    blockers,
    pivots,
    nextMonthStrategy,
    managerFeedback,
    selfReflection,
    goNoGo,
  };
  if (submitted) data.submittedAt = new Date();
  if (kpiData) data.kpis = { create: kpiData };

  let scorecard;
  if (existing) {
    if (kpiData) await prisma.scorecardKpi.deleteMany({ where: { scorecardId: existing.id } });
    scorecard = await prisma.monthlyScorecard.update({
      where: { id: existing.id },
      data,
      include: { kpis: { include: { metric: true } } },
    });
  } else {
    scorecard = await prisma.monthlyScorecard.create({
      data: {
        userId,
        managerId: user.managerId || req.user!.id,
        month: monthDate,
        ...data,
      },
      include: { kpis: { include: { metric: true } } },
    });
  }
  res.status(existing ? 200 : 201).json(scorecard);
});

export default router;
