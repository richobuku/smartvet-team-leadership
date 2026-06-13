import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { sendCalendarInvite } from "../lib/calendarInvite";

const router = Router();
router.use(requireAuth);

const includeUsersForInvite = {
  user: { select: { id: true, name: true, email: true } },
  manager: { select: { id: true, name: true, email: true } },
};

async function checkUserAccess(req: any, targetId: string): Promise<boolean> {
  const role = req.user!.role;
  if (req.user!.id === targetId || role === "admin" || role === "executive") return true;
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  return !!target && target.managerId === req.user!.id;
}

router.get("/user/:userId", async (req, res) => {
  if (!(await checkUserAccess(req, req.params.userId))) return res.status(403).json({ error: "Forbidden" });
  const logs = await prisma.coachingLog.findMany({
    where: { userId: req.params.userId },
    include: { manager: { select: { id: true, name: true } }, checkIns: true },
    orderBy: { date: "desc" },
  });
  res.json(logs);
});

router.get("/manager/:managerId", async (req, res) => {
  const role = req.user!.role;
  const isAdmin = role === "admin" || role === "executive";
  if (!isAdmin && req.user!.id !== req.params.managerId) return res.status(403).json({ error: "Forbidden" });
  const logs = await prisma.coachingLog.findMany({
    where: { managerId: req.params.managerId },
    include: { user: { select: { id: true, name: true } }, checkIns: true },
    orderBy: { date: "desc" },
  });
  res.json(logs);
});

router.post("/", async (req, res) => {
  const { userId, topic, notes, action, followUp, date, rootCause } = req.body;
  if (!userId || !topic) return res.status(400).json({ error: "userId and topic are required" });
  const log = await prisma.coachingLog.create({
    data: {
      userId,
      managerId: req.user!.id,
      topic,
      notes: rootCause ? `${notes ?? ""}\n\nRoot cause: ${rootCause}`.trim() : notes,
      action,
      followUp: followUp ? new Date(followUp) : null,
      date: date ? new Date(date) : new Date(),
    },
    include: includeUsersForInvite,
  });

  if (log.followUp) {
    sendCalendarInvite({
      uid: `coaching-followup-${log.id}`,
      title: `Coaching Follow-up: ${log.topic}`,
      description: `Follow-up on coaching topic "${log.topic}" between ${log.user.name} and ${log.manager.name}.${log.action ? `\n\nAction: ${log.action}` : ""}`,
      start: log.followUp,
      durationMinutes: 15,
      attendees: [log.user, log.manager],
    }).catch(() => {});
  }

  res.status(201).json(log);
});

router.put("/:id", async (req, res) => {
  const existing = await prisma.coachingLog.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const isManager = existing.managerId === req.user!.id;
  const isAdmin = req.user!.role === "admin" || req.user!.role === "executive";
  if (!isManager && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const { topic, notes, action, followUp, outcome } = req.body;
  const newFollowUp = followUp ? new Date(followUp) : undefined;
  const log = await prisma.coachingLog.update({
    where: { id: req.params.id },
    data: {
      topic,
      notes,
      action,
      followUp: newFollowUp,
      outcome,
    },
    include: includeUsersForInvite,
  });

  if (newFollowUp && (!existing.followUp || newFollowUp.getTime() !== existing.followUp.getTime())) {
    sendCalendarInvite({
      uid: `coaching-followup-${log.id}`,
      title: `Coaching Follow-up: ${log.topic}`,
      description: `Follow-up on coaching topic "${log.topic}" between ${log.user.name} and ${log.manager.name}.${log.action ? `\n\nAction: ${log.action}` : ""}`,
      start: log.followUp!,
      durationMinutes: 15,
      attendees: [log.user, log.manager],
    }).catch(() => {});
  }

  res.json(log);
});

router.post("/:id/checkins", async (req, res) => {
  const log = await prisma.coachingLog.findUnique({ where: { id: req.params.id } });
  if (!log) return res.status(404).json({ error: "Not found" });

  const isManager = log.managerId === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isManager && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const { type, notes, decision } = req.body;
  if (!type) return res.status(400).json({ error: "type is required" });
  const checkIn = await prisma.coachingCheckIn.create({
    data: { coachingLogId: req.params.id, type, notes, decision: decision || "pending" },
  });
  res.status(201).json(checkIn);
});

export default router;
