import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendApplicantStageEmail, sendHireWelcomeEmail } from "../lib/recruitmentEmail";
import { sendVerificationEmail } from "../lib/verificationEmail";
import { sendPanelInviteEmail } from "../lib/panelEmail";
import { sendBinderInviteEmail } from "../lib/binderEmail";
import { sendPushToUser } from "../lib/push";

const router = Router();
// Router-level gate: every route below requires admin/hr_manager/executive.
// Individual routes may stack a stricter requireRole (e.g. DELETE is admin-only).
router.use(requireAuth, requireRole("admin", "hr_manager", "executive"));

const VERIFICATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

const STAGES = ["received", "shortlisted", "interview_1", "interview_2", "hired", "rejected"];
const ROLES = ["team_member", "team_leader", "executive", "admin", "hr_manager"];
const ELEVATED_ROLES = ["admin", "hr_manager", "executive"];

async function teamExists(teamId: string): Promise<boolean> {
  return !!(await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } }));
}

function findActiveApplicant(id: string) {
  return prisma.applicant.findFirst({ where: { id, deletedAt: null } });
}

const includeBasic = {
  team: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  hiredUser: { select: { id: true, name: true, email: true } },
};

router.get("/", async (req, res) => {
  const { stage } = req.query;
  if (stage !== undefined && !STAGES.includes(stage as string)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(", ")}` });
  }
  const where: Record<string, any> = { deletedAt: null };
  if (stage) where.stage = stage;
  const applicants = await prisma.applicant.findMany({
    where,
    include: includeBasic,
    orderBy: { createdAt: "desc" },
  });
  res.json(applicants);
});

router.get("/:id", async (req, res) => {
  const applicant = await prisma.applicant.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      ...includeBasic,
      activities: {
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      panels: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      binders: {
        include: {
          contributions: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!applicant) return res.status(404).json({ error: "Not found" });
  res.json(applicant);
});

router.post("/", async (req, res) => {
  const { name, email, phone, position, source, resumeUrl, notes, teamId } = req.body;
  if (!name || !email || !position) {
    return res.status(400).json({ error: "name, email, position are required" });
  }
  if (teamId && !(await teamExists(teamId))) {
    return res.status(400).json({ error: "Invalid teamId" });
  }
  const applicant = await prisma.applicant.create({
    data: { name, email, phone, position, source, resumeUrl, notes, teamId, createdById: req.user!.id },
    include: includeBasic,
  });
  await prisma.applicantActivity.create({
    data: { applicantId: applicant.id, type: "stage_change", toStage: "received", createdById: req.user!.id },
  });
  sendApplicantStageEmail(applicant.email, applicant.name, "received").catch(() => {});
  res.status(201).json(applicant);
});

router.put("/:id", async (req, res) => {
  const applicant = await findActiveApplicant(req.params.id);
  if (!applicant) return res.status(404).json({ error: "Not found" });

  const allowedFields = ["name", "email", "phone", "position", "source", "resumeUrl", "notes", "teamId"];
  const data: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in req.body) data[field] = req.body[field];
  }
  if (data.teamId && !(await teamExists(data.teamId))) {
    return res.status(400).json({ error: "Invalid teamId" });
  }
  const updated = await prisma.applicant.update({ where: { id: req.params.id }, data, include: includeBasic });
  res.json(updated);
});

router.post("/:id/notes", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "content is required" });

  const applicant = await findActiveApplicant(req.params.id);
  if (!applicant) return res.status(404).json({ error: "Not found" });

  const activity = await prisma.applicantActivity.create({
    data: { applicantId: applicant.id, type: "note", content, createdById: req.user!.id },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  res.status(201).json(activity);
});

// Re-sends the stage-notification email for the applicant's current stage
// (or a specified past stage) — lets HR resend a templated email with one click.
router.post("/:id/resend-email", async (req, res) => {
  const { stage } = req.body;
  const applicant = await findActiveApplicant(req.params.id);
  if (!applicant) return res.status(404).json({ error: "Not found" });

  const targetStage = stage && STAGES.includes(stage) ? stage : applicant.stage;

  await sendApplicantStageEmail(applicant.email, applicant.name, targetStage);
  const activity = await prisma.applicantActivity.create({
    data: { applicantId: applicant.id, type: "email", content: `Stage notification resent for "${targetStage}"`, createdById: req.user!.id },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  res.status(201).json(activity);
});

// Creates an interview panel for an applicant currently in interview_1/interview_2,
// assigns panelists, and emails each panelist a link to submit their evaluation.
router.post("/:id/panels", async (req, res) => {
  const { standard, scheduledAt, panelistIds } = req.body;

  if (!standard || !["ey", "mckinsey"].includes(standard)) {
    return res.status(400).json({ error: "standard must be one of: ey, mckinsey" });
  }
  if (!Array.isArray(panelistIds) || panelistIds.length === 0) {
    return res.status(400).json({ error: "panelistIds must be a non-empty array" });
  }

  const applicant = await findActiveApplicant(req.params.id);
  if (!applicant) return res.status(404).json({ error: "Not found" });
  if (!["interview_1", "interview_2"].includes(applicant.stage)) {
    return res.status(400).json({ error: "Applicant must be in interview_1 or interview_2 to create a panel" });
  }

  const panelists = await prisma.user.findMany({
    where: { id: { in: panelistIds } },
    select: { id: true, name: true, email: true },
  });
  if (panelists.length !== panelistIds.length) {
    return res.status(400).json({ error: "One or more panelistIds are invalid" });
  }

  const panel = await prisma.interviewPanel.create({
    data: {
      applicantId: applicant.id,
      stage: applicant.stage,
      standard,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdById: req.user!.id,
      members: { create: panelists.map((p) => ({ userId: p.id })) },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  for (const p of panelists) {
    sendPanelInviteEmail(p.email, p.name, applicant.name, applicant.position, standard, panel.id, panel.scheduledAt).catch(() => {});
    sendPushToUser(p.id, {
      title: "New interview panel assignment",
      body: `You've been added to the ${standard.toUpperCase()} panel for ${applicant.name} (${applicant.position}).`,
      url: "/panels",
    }).catch(() => {});
  }

  await prisma.applicantActivity.create({
    data: {
      applicantId: applicant.id,
      type: "note",
      content: `Interview panel created (${standard.toUpperCase()} standard) for stage "${applicant.stage}" with ${panelists.length} panelist(s): ${panelists.map((p) => p.name).join(", ")}`,
      createdById: req.user!.id,
    },
  });

  res.status(201).json(panel);
});

// Creates a candidate review binder for the applicant's current stage,
// assigns a small review team, and emails each reviewer a link to submit
// their notes ahead of the interview panel.
router.post("/:id/binder", async (req, res) => {
  const { reviewerIds } = req.body;

  if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
    return res.status(400).json({ error: "reviewerIds must be a non-empty array" });
  }

  const applicant = await findActiveApplicant(req.params.id);
  if (!applicant) return res.status(404).json({ error: "Not found" });

  const reviewers = await prisma.user.findMany({
    where: { id: { in: reviewerIds } },
    select: { id: true, name: true, email: true },
  });
  if (reviewers.length !== reviewerIds.length) {
    return res.status(400).json({ error: "One or more reviewerIds are invalid" });
  }

  const binder = await prisma.candidateBinder.create({
    data: {
      applicantId: applicant.id,
      stage: applicant.stage,
      createdById: req.user!.id,
      contributions: { create: reviewers.map((r) => ({ userId: r.id })) },
    },
    include: {
      contributions: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  for (const r of reviewers) {
    sendBinderInviteEmail(r.email, r.name, applicant.name, applicant.position, binder.id).catch(() => {});
    sendPushToUser(r.id, {
      title: "New candidate binder assignment",
      body: `You've been added to the review binder for ${applicant.name} (${applicant.position}).`,
      url: "/binders",
    }).catch(() => {});
  }

  await prisma.applicantActivity.create({
    data: {
      applicantId: applicant.id,
      type: "note",
      content: `Candidate review binder created for stage "${applicant.stage}" with ${reviewers.length} reviewer(s): ${reviewers.map((r) => r.name).join(", ")}`,
      createdById: req.user!.id,
    },
  });

  res.status(201).json(binder);
});

router.post("/:id/stage", async (req, res) => {
  const { stage, notify } = req.body;
  if (!stage || !STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(", ")}` });
  }
  if (stage === "hired") {
    return res.status(400).json({ error: "Use POST /:id/hire to move an applicant to hired" });
  }

  const applicant = await findActiveApplicant(req.params.id);
  if (!applicant) return res.status(404).json({ error: "Not found" });

  const fromStage = applicant.stage;
  const updated = await prisma.applicant.update({
    where: { id: req.params.id },
    data: { stage },
    include: includeBasic,
  });
  await prisma.applicantActivity.create({
    data: { applicantId: applicant.id, type: "stage_change", fromStage, toStage: stage, createdById: req.user!.id },
  });

  if (notify !== false) {
    sendApplicantStageEmail(applicant.email, applicant.name, stage).catch(() => {});
    await prisma.applicantActivity.create({
      data: { applicantId: applicant.id, type: "email", content: `Stage notification sent for "${stage}"`, createdById: req.user!.id },
    });
  }

  if (applicant.createdById && applicant.createdById !== req.user!.id) {
    sendPushToUser(applicant.createdById, {
      title: "Applicant stage updated",
      body: `${applicant.name} moved from "${fromStage}" to "${stage}".`,
      url: `/hr/recruitment/${applicant.id}`,
    }).catch(() => {});
  }

  res.json(updated);
});

// Hires an applicant: provisions a User account (team_member by default),
// links it via hiredUserId, marks the applicant as hired, and emails the
// new hire their login credentials plus an email-verification link.
router.post("/:id/hire", async (req, res) => {
  const { teamId, managerId, weeklyTarget, role } = req.body;

  if (role !== undefined && !ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLES.join(", ")}` });
  }
  if (role && ELEVATED_ROLES.includes(role) && req.user!.role !== "admin") {
    return res.status(403).json({ error: "Only an admin can assign this role" });
  }
  if (teamId && !(await teamExists(teamId))) {
    return res.status(400).json({ error: "Invalid teamId" });
  }
  if (managerId && !(await prisma.user.findUnique({ where: { id: managerId }, select: { id: true } }))) {
    return res.status(400).json({ error: "Invalid managerId" });
  }

  const applicant = await findActiveApplicant(req.params.id);
  if (!applicant) return res.status(404).json({ error: "Not found" });
  if (applicant.hiredUserId) return res.status(400).json({ error: "Applicant has already been hired" });

  const existing = await prisma.user.findUnique({ where: { email: applicant.email } });
  if (existing) return res.status(409).json({ error: "A user with this email already exists" });

  const tempPassword = crypto.randomBytes(9).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  const user = await prisma.user.create({
    data: {
      name: applicant.name,
      email: applicant.email,
      passwordHash,
      role: role || "team_member",
      teamId: teamId || applicant.teamId,
      managerId,
      weeklyTarget,
      verificationToken,
      verificationTokenExpiry,
    },
  });

  const fromStage = applicant.stage;
  const updated = await prisma.applicant.update({
    where: { id: req.params.id },
    data: { stage: "hired", hiredUserId: user.id, teamId: teamId || applicant.teamId },
    include: includeBasic,
  });
  await prisma.applicantActivity.create({
    data: { applicantId: applicant.id, type: "stage_change", fromStage, toStage: "hired", createdById: req.user!.id },
  });
  await prisma.applicantActivity.create({
    data: { applicantId: applicant.id, type: "email", content: "Hired — account created and welcome email sent", createdById: req.user!.id },
  });

  sendApplicantStageEmail(applicant.email, applicant.name, "hired").catch(() => {});
  sendHireWelcomeEmail(user.email, user.name, tempPassword).catch(() => {});
  sendVerificationEmail(user.email, user.name, verificationToken).catch(() => {});

  if (applicant.createdById && applicant.createdById !== req.user!.id) {
    sendPushToUser(applicant.createdById, {
      title: "Applicant hired",
      body: `${applicant.name} has been hired and a user account was created.`,
      url: `/hr/recruitment/${applicant.id}`,
    }).catch(() => {});
  }

  res.json(updated);
});

// Soft-deletes an applicant, preserving their activity/panel/binder history
// for record-keeping while hiding them from the pipeline.
router.delete("/:id", requireRole("admin"), async (req, res) => {
  const applicant = await findActiveApplicant(req.params.id);
  if (!applicant) return res.status(404).json({ error: "Not found" });
  await prisma.applicant.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.status(204).end();
});

export default router;
