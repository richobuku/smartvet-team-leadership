import webpush from "web-push";
import { prisma } from "./prisma";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@smartvet.africa";

const configured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (configured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Best-effort send: failures are logged, never thrown, so a missing/broken
// push config can't block the API request that triggered the notification.
// Expired subscriptions (404/410) are pruned from the database.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!configured) {
    console.log(`[push] VAPID not configured — skipping push "${payload.title}" to user ${userId}`);
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  const json = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          json
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`[push] Failed to send "${payload.title}" to user ${userId}:`, err?.message || err);
        }
      }
    })
  );
}
