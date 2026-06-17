import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";

router.get("/vapid-public-key", (_req, res) => {
  res.json({ key: VAPID_PUBLIC_KEY });
});

router.post("/subscribe", async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "endpoint and keys.{p256dh,auth} are required" });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: req.user!.id, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: req.user!.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  res.status(201).json({ ok: true });
});

router.post("/unsubscribe", async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: "endpoint is required" });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user!.id } });
  res.json({ ok: true });
});

export default router;
