import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendCalendarInvite } from "../lib/calendarInvite";

const router = Router();
router.use(requireAuth);

const includeUsers = {
  user: { select: { id: true, name: true, email: true } },
  manager: { select: { id: true, name: true, email: true } },
};

const TYPE_LABELS: Record<string, string> = {
  underperformance: "Underperformance",
  quality_issue: "Quality Issue",
  behavior: "Behavior/Attitude",
  conflict: "Conflict",
  churn_risk: "Churn Risk",
};

router.get("/", async (req, res) => {
  const role = req.user!.role;
  let where = {};
  if (role === "team_leader") {
    where = { managerId: req.user!.id };
  } else if (role === "team_member") {
    where = { userId: req.user!.id };
  }
  const conversations = await prisma.feedbackConversation.findMany({ where, include: includeUsers, orderBy: { date: "desc" } });
  res.json(conversations);
});

router.post("/", requireRole("team_leader", "admin"), async (req, res) => {
  const { userId, conversationType } = req.body;
  if (!userId || !conversationType) return res.status(400).json({ error: "userId and conversationType are required" });
  const conversation = await prisma.feedbackConversation.create({
    data: {
      userId,
      managerId: req.user!.id,
      conversationType,
    },
    include: includeUsers,
  });
  res.status(201).json(conversation);
});

router.put("/:id", async (req, res) => {
  const conversation = await prisma.feedbackConversation.findUnique({ where: { id: req.params.id } });
  if (!conversation) return res.status(404).json({ error: "Not found" });

  const isManager = conversation.managerId === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isManager && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const { behavior, rootCause, impact, actionPlan, followUpDate, status } = req.body;
  const data: Record<string, any> = {};
  if (behavior !== undefined) data.behavior = behavior;
  if (rootCause !== undefined) data.rootCause = rootCause;
  if (impact !== undefined) data.impact = impact;
  if (actionPlan !== undefined) data.actionPlan = actionPlan;
  if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;
  if (status !== undefined) data.status = status;

  const updated = await prisma.feedbackConversation.update({ where: { id: req.params.id }, data, include: includeUsers });

  if (
    data.followUpDate &&
    (!conversation.followUpDate || data.followUpDate.getTime() !== conversation.followUpDate.getTime())
  ) {
    sendCalendarInvite({
      uid: `feedback-followup-${updated.id}`,
      title: `Feedback Follow-up: ${TYPE_LABELS[updated.conversationType] || "Feedback"}`,
      description: `Follow-up on a ${TYPE_LABELS[updated.conversationType]?.toLowerCase() || "feedback"} conversation between ${updated.user.name} and ${updated.manager.name}.${updated.actionPlan ? `\n\nAction plan: ${updated.actionPlan}` : ""}`,
      start: data.followUpDate,
      durationMinutes: 15,
      attendees: [updated.user, updated.manager],
    }).catch(() => {});
  }

  res.json(updated);
});

export default router;
