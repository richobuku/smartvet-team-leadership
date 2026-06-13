import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const includeUsers = {
  user: { select: { id: true, name: true, email: true, teamId: true, team: { select: { id: true, name: true } }, churnRisk: true, status: true } },
  supervisor: { select: { id: true, name: true } },
};

router.get("/", async (req, res) => {
  const role = req.user!.role;
  let where = {};
  if (role === "team_leader") {
    where = { supervisorId: req.user!.id };
  } else if (role === "team_member") {
    where = { userId: req.user!.id };
  }
  const internships = await prisma.internship.findMany({ where, include: includeUsers, orderBy: { startDate: "desc" } });
  res.json(internships);
});

router.get("/:id", async (req, res) => {
  const internship = await prisma.internship.findUnique({ where: { id: req.params.id }, include: includeUsers });
  if (!internship) return res.status(404).json({ error: "Not found" });
  const role = req.user!.role;
  if (role === "team_leader" && internship.supervisorId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  if (role === "team_member" && internship.userId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  res.json(internship);
});

router.post("/", requireRole("admin"), async (req, res) => {
  const { userId, supervisorId, track, startDate, plannedEndDate } = req.body;
  const internship = await prisma.internship.create({
    data: {
      userId,
      supervisorId,
      track,
      startDate: new Date(startDate),
      plannedEndDate: new Date(plannedEndDate),
    },
    include: includeUsers,
  });
  await prisma.user.update({ where: { id: userId }, data: { employmentType: "intern" } });
  res.status(201).json(internship);
});

router.put("/:id", async (req, res) => {
  const internship = await prisma.internship.findUnique({ where: { id: req.params.id } });
  if (!internship) return res.status(404).json({ error: "Not found" });

  const role = req.user!.role;
  const isSupervisor = internship.supervisorId === req.user!.id;
  const isAdmin = role === "admin";
  if (!isSupervisor && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const allowedFields = isAdmin
    ? ["track", "startDate", "plannedEndDate", "status", "conversionDecision", "conversionNotes", "supervisorId", "readiness", "overallAssessment"]
    : ["conversionDecision", "conversionNotes", "readiness", "overallAssessment"];

  const data: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in req.body) data[field] = req.body[field];
  }
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.plannedEndDate) data.plannedEndDate = new Date(data.plannedEndDate);
  if (data.conversionDecision && data.conversionDecision !== "pending") data.decidedAt = new Date();
  if (data.readiness !== undefined || data.overallAssessment !== undefined) data.assessmentUpdatedAt = new Date();

  const updated = await prisma.internship.update({ where: { id: req.params.id }, data, include: includeUsers });
  res.json(updated);
});

// Unified chronological timeline of coaching, celebrations, feedback/disciplinary conversations,
// and 1-on-1s for this intern — feeds the internship profile and future AI analysis.
router.get("/:id/timeline", async (req, res) => {
  const internship = await prisma.internship.findUnique({ where: { id: req.params.id } });
  if (!internship) return res.status(404).json({ error: "Not found" });

  const role = req.user!.role;
  const isAdmin = role === "admin" || role === "executive";
  const isSupervisor = internship.supervisorId === req.user!.id;
  const isSelf = internship.userId === req.user!.id;
  if (!isAdmin && !isSupervisor && !isSelf) return res.status(403).json({ error: "Forbidden" });

  const userId = internship.userId;
  const userSelect = { id: true, name: true };

  const [coachingLogs, celebrations, feedbackConversations, oneOnOnes] = await Promise.all([
    prisma.coachingLog.findMany({
      where: { userId },
      include: { manager: { select: userSelect }, checkIns: true },
    }),
    prisma.celebrationLog.findMany({
      where: { userId },
      include: { manager: { select: userSelect } },
    }),
    prisma.feedbackConversation.findMany({
      where: { userId },
      include: { manager: { select: userSelect } },
    }),
    prisma.oneOnOne.findMany({
      where: { userId },
      include: { manager: { select: userSelect } },
    }),
  ]);

  const events = [
    ...coachingLogs.map((c) => ({
      type: "coaching",
      date: c.date,
      id: c.id,
      manager: c.manager,
      topic: c.topic,
      notes: c.notes,
      action: c.action,
      followUp: c.followUp,
      outcome: c.outcome,
      checkIns: c.checkIns,
    })),
    ...celebrations.map((c) => ({
      type: "celebration",
      date: c.date,
      id: c.id,
      manager: c.manager,
      achievement: c.achievement,
      impact: c.impact,
      visibility: c.visibility,
      notes: c.notes,
    })),
    ...feedbackConversations.map((f) => ({
      type: "feedback",
      date: f.date,
      id: f.id,
      manager: f.manager,
      conversationType: f.conversationType,
      behavior: f.behavior,
      rootCause: f.rootCause,
      impact: f.impact,
      actionPlan: f.actionPlan,
      followUpDate: f.followUpDate,
      status: f.status,
    })),
    ...oneOnOnes.map((o) => ({
      type: "oneonone",
      date: o.scheduledAt,
      id: o.id,
      manager: o.manager,
      oneOnOneType: o.type,
      status: o.status,
      notes: o.notes,
      actionItems: o.actionItems,
      recapNotes: o.recapNotes,
      completedAt: o.completedAt,
    })),
  ];

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({
    summary: {
      coachingCount: coachingLogs.length,
      celebrationCount: celebrations.length,
      feedbackCount: feedbackConversations.length,
      openFeedbackCount: feedbackConversations.filter((f) => f.status === "open").length,
      oneOnOneCount: oneOnOnes.length,
    },
    events,
  });
});

router.post("/:id/convert", requireRole("admin"), async (req, res) => {
  const internship = await prisma.internship.findUnique({ where: { id: req.params.id } });
  if (!internship) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.internship.update({
    where: { id: req.params.id },
    data: { status: "converted" },
    include: includeUsers,
  });
  await prisma.user.update({ where: { id: internship.userId }, data: { employmentType: "staff" } });
  res.json(updated);
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.internship.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
