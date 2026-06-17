import { useEffect, useState } from "react";
import { subscribeToPush, isPushSupported } from "../lib/push";

// Shows a bell button that prompts the user to enable push notifications.
// Hides itself once permission has been granted (or if push isn't supported).
export default function NotificationBell() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) setPermission("unsupported");
  }, []);

  if (permission === "granted" || permission === "unsupported") return null;

  async function handleClick() {
    setBusy(true);
    try {
      await subscribeToPush();
      setPermission(Notification.permission);
    } catch {
      setPermission(Notification.permission);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title="Enable push notifications"
      aria-label="Enable push notifications"
      className="inline-flex items-center justify-center rounded-full p-2 text-navy/70 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.66V5a2 2 0 1 0-4 0v.34A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v1a3 3 0 0 0 6 0v-1" />
      </svg>
    </button>
  );
}
