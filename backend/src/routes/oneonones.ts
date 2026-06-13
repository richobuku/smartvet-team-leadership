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
  weekly: "Weekly 1-on-1",
  monthly: "Monthly 1-on-1",
  quarterly: "Quarterly 1-on-1",
};

router.get("/", async (req, res) => {
  const role = req.user!.role;
  let where = {};
  if (role === "team_leader") {
    where = { managerId: req.user!.id };
  } else if (role === "team_member") {
    where = { userId: req.user!.id };
  }
  const oneOnOnes = await prisma.oneOnOne.findMany({ where, include: includeUsers, orderBy: { scheduledAt: "desc" } });
  res.json(oneOnOnes);
});

router.post("/", requireRole("team_leader", "admin"), async (req, res) => {
  const { userId, type, scheduledAt } = req.body;
  if (!userId || !type || !scheduledAt) return res.status(400).json({ error: "userId, type, and scheduledAt are required" });
  const oneOnOne = await prisma.oneOnOne.create({
    data: {
      userId,
      managerId: req.user!.id,
      type,
      scheduledAt: new Date(scheduledAt),
    },
    include: includeUsers,
  });

  sendCalendarInvite({
    uid: `oneonone-${oneOnOne.id}`,
    title: `${TYPE_LABELS[type] || "1-on-1"}: ${oneOnOne.user.name} & ${oneOnOne.manager.name}`,
    description: `${TYPE_LABELS[type] || "1-on-1"} between ${oneOnOne.user.name} and ${oneOnOne.manager.name}.`,
    start: oneOnOne.scheduledAt,
    durationMinutes: 30,
    attendees: [oneOnOne.user, oneOnOne.manager],
  }).catch(() => {});

  res.status(201).json(oneOnOne);
});

router.put("/:id", async (req, res) => {
  const oneOnOne = await prisma.oneOnOne.findUnique({ where: { id: req.params.id } });
  if (!oneOnOne) return res.status(404).json({ error: "Not found" });

  const isManager = oneOnOne.managerId === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isManager && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const { notes, actionItems, recapNotes, status, scheduledAt } = req.body;
  const data: Record<string, any> = {};
  if (notes !== undefined) data.notes = notes;
  if (actionItems !== undefined) data.actionItems = actionItems;
  if (recapNotes !== undefined) data.recapNotes = recapNotes;
  if (status !== undefined) data.status = status;
  if (scheduledAt !== undefined) data.scheduledAt = new Date(scheduledAt);

  const updated = await prisma.oneOnOne.update({ where: { id: req.params.id }, data, include: includeUsers });

  if (data.scheduledAt && data.scheduledAt.getTime() !== oneOnOne.scheduledAt.getTime()) {
    sendCalendarInvite({
      uid: `oneonone-${updated.id}`,
      title: `${TYPE_LABELS[updated.type] || "1-on-1"}: ${updated.user.name} & ${updated.manager.name}`,
      description: `${TYPE_LABELS[updated.type] || "1-on-1"} between ${updated.user.name} and ${updated.manager.name} (rescheduled).`,
      start: updated.scheduledAt,
      durationMinutes: 30,
      attendees: [updated.user, updated.manager],
    }).catch(() => {});
  }

  res.json(updated);
});

router.post("/:id/complete", async (req, res) => {
  const oneOnOne = await prisma.oneOnOne.findUnique({ where: { id: req.params.id } });
  if (!oneOnOne) return res.status(404).json({ error: "Not found" });

  const isManager = oneOnOne.managerId === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isManager && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const { notes, actionItems, recapNotes } = req.body;
  const updated = await prisma.oneOnOne.update({
    where: { id: req.params.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      notes,
      actionItems,
      recapNotes,
    },
    include: includeUsers,
  });
  res.json(updated);
});

export default router;
