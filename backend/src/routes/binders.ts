import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const binderInclude = {
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
    },
  },
  contributions: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
};

// Lists binders where the current user is a contributor.
router.get("/", async (req, res) => {
  const binders = await prisma.candidateBinder.findMany({
    where: { contributions: { some: { userId: req.user!.id } } },
    include: binderInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(binders);
});

router.get("/:id", async (req, res) => {
  const binder = await prisma.candidateBinder.findUnique({
    where: { id: req.params.id },
    include: binderInclude,
  });
  if (!binder) return res.status(404).json({ error: "Not found" });

  const isContributor = binder.contributions.some((c) => c.userId === req.user!.id);
  const isHr = ["admin", "hr_manager", "executive"].includes(req.user!.role);
  if (!isContributor && !isHr) return res.status(403).json({ error: "Forbidden" });

  res.json(binder);
});

// A reviewer submits their summary, strengths/concerns, and probing questions.
router.put("/:id/respond", async (req, res) => {
  const { summary, strengths, concerns, probingQuestions } = req.body;

  const binder = await prisma.candidateBinder.findUnique({
    where: { id: req.params.id },
    include: { contributions: true },
  });
  if (!binder) return res.status(404).json({ error: "Not found" });

  const contribution = binder.contributions.find((c) => c.userId === req.user!.id);
  if (!contribution) return res.status(403).json({ error: "You are not on the review team for this candidate" });
  if (contribution.submittedAt) return res.status(409).json({ error: "You have already submitted your review" });

  await prisma.binderContribution.update({
    where: { id: contribution.id },
    data: { summary, strengths, concerns, probingQuestions, submittedAt: new Date() },
  });

  const updatedContributions = await prisma.binderContribution.findMany({ where: { binderId: binder.id } });
  const allSubmitted = updatedContributions.every((c) => c.submittedAt !== null);
  const anySubmitted = updatedContributions.some((c) => c.submittedAt !== null);

  const updated = await prisma.candidateBinder.update({
    where: { id: binder.id },
    data: { status: allSubmitted ? "completed" : anySubmitted ? "in_progress" : "pending" },
    include: binderInclude,
  });

  res.json(updated);
});

export default router;
