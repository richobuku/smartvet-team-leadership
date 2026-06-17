import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendPanelInviteEmail } from "../lib/panelEmail";

const router = Router();
router.use(requireAuth);

const DECISION_SCORES: Record<string, number> = {
  strong_yes: 2,
  yes: 1,
  no: -1,
  strong_no: -2,
};

function aggregateDecision(decisions: string[]): "strong_yes" | "yes" | "no" | "strong_no" {
  const total = decisions.reduce((sum, d) => sum + (DECISION_SCORES[d] || 0), 0);
  const avg = total / decisions.length;
  if (avg >= 1.5) return "strong_yes";
  if (avg > 0) return "yes";
  if (avg <= -1.5) return "strong_no";
  return "no";
}

const panelInclude = {
  applicant: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      position: true,
      stage: true,
      source: true,
      resumeUrl: true,
      notes: true,
      appliedDate: true,
      binders: {
        include: {
          contributions: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { createdAt: "desc" as const },
      },
    },
  },
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
};

// Lists panels where the current user is a member.
router.get("/", async (req, res) => {
  const panels = await prisma.interviewPanel.findMany({
    where: { members: { some: { userId: req.user!.id } } },
    include: panelInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(panels);
});

router.get("/:id", async (req, res) => {
  const panel = await prisma.interviewPanel.findUnique({
    where: { id: req.params.id },
    include: panelInclude,
  });
  if (!panel) return res.status(404).json({ error: "Not found" });

  const isMember = panel.members.some((m) => m.userId === req.user!.id);
  const isHr = ["admin", "hr_manager", "executive"].includes(req.user!.role);
  if (!isMember && !isHr) return res.status(403).json({ error: "Forbidden" });

  res.json(panel);
});

// HR/admin/executive updates a panel's standard, schedule, and panelist roster.
// Newly added panelists are emailed an invite; removed panelists lose their submission.
router.put("/:id", requireRole("admin", "hr_manager", "executive"), async (req, res) => {
  const { standard, scheduledAt, panelistIds } = req.body;

  const panel = await prisma.interviewPanel.findUnique({
    where: { id: req.params.id },
    include: { members: true, applicant: { select: { name: true, position: true } } },
  });
  if (!panel) return res.status(404).json({ error: "Not found" });

  const data: Record<string, any> = {};

  if (standard !== undefined) {
    if (!["ey", "mckinsey"].includes(standard)) {
      return res.status(400).json({ error: "standard must be one of: ey, mckinsey" });
    }
    data.standard = standard;
  }

  if (scheduledAt !== undefined) {
    data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  }

  let newPanelists: { id: string; name: string; email: string }[] = [];

  if (panelistIds !== undefined) {
    if (!Array.isArray(panelistIds) || panelistIds.length === 0) {
      return res.status(400).json({ error: "panelistIds must be a non-empty array" });
    }

    const panelists = await prisma.user.findMany({
      where: { id: { in: panelistIds } },
      select: { id: true, name: true, email: true },
    });
    if (panelists.length !== panelistIds.length) {
      return res.status(400).json({ error: "One or more panelistIds are invalid" });
    }

    const existingIds = panel.members.map((m) => m.userId);
    const toRemove = existingIds.filter((id) => !panelistIds.includes(id));
    const toAdd = panelistIds.filter((id: string) => !existingIds.includes(id));
    newPanelists = panelists.filter((p) => toAdd.includes(p.id));

    await prisma.$transaction(async (tx) => {
      if (toRemove.length > 0) {
        await tx.panelMember.deleteMany({ where: { panelId: panel.id, userId: { in: toRemove } } });
      }
      if (toAdd.length > 0) {
        await tx.panelMember.createMany({
          data: toAdd.map((userId: string) => ({ panelId: panel.id, userId })),
          skipDuplicates: true,
        });
      }
    });
  }

  const updatedMembers = await prisma.panelMember.findMany({ where: { panelId: panel.id } });
  const allSubmitted = updatedMembers.every((m) => m.submittedAt !== null);
  const anySubmitted = updatedMembers.some((m) => m.submittedAt !== null);
  data.status = allSubmitted ? "completed" : anySubmitted ? "in_progress" : "scheduled";
  data.overallDecision = allSubmitted ? aggregateDecision(updatedMembers.map((m) => m.decision)) : "pending";

  const updated = await prisma.interviewPanel.update({
    where: { id: panel.id },
    data,
    include: panelInclude,
  });

  for (const p of newPanelists) {
    sendPanelInviteEmail(p.email, p.name, panel.applicant.name, panel.applicant.position, updated.standard, panel.id, updated.scheduledAt).catch(() => {});
  }

  res.json(updated);
});

// A panelist submits their decision, scores, and notes for a panel.
router.put("/:id/respond", async (req, res) => {
  const { decision, scores, notes } = req.body;
  if (!decision || !["strong_yes", "yes", "no", "strong_no"].includes(decision)) {
    return res.status(400).json({ error: "decision must be one of: strong_yes, yes, no, strong_no" });
  }

  const panel = await prisma.interviewPanel.findUnique({
    where: { id: req.params.id },
    include: { members: true },
  });
  if (!panel) return res.status(404).json({ error: "Not found" });

  const member = panel.members.find((m) => m.userId === req.user!.id);
  if (!member) return res.status(403).json({ error: "You are not a member of this panel" });
  if (member.submittedAt) return res.status(409).json({ error: "You have already submitted your evaluation" });

  await prisma.panelMember.update({
    where: { id: member.id },
    data: { decision, scores, notes, submittedAt: new Date() },
  });

  const updatedMembers = await prisma.panelMember.findMany({ where: { panelId: panel.id } });
  const allSubmitted = updatedMembers.every((m) => m.submittedAt !== null);

  const updated = await prisma.interviewPanel.update({
    where: { id: panel.id },
    data: allSubmitted
      ? {
          status: "completed",
          overallDecision: aggregateDecision(updatedMembers.map((m) => m.decision)),
        }
      : { status: "in_progress" },
    include: panelInclude,
  });

  res.json(updated);
});

export default router;
