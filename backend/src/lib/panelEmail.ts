import { sendMail, emailLayout, escapeHtml } from "./email";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";

const STANDARD_LABELS: Record<string, string> = { ey: "EY", mckinsey: "McKinsey" };

// Notifies a panelist that they've been assigned to an interview panel, with
// a link straight to their scoring form.
export async function sendPanelInviteEmail(
  to: string,
  panelistName: string,
  applicantName: string,
  position: string,
  standard: string,
  panelId: string,
  scheduledAt?: Date | null
): Promise<void> {
  const link = `${FRONTEND_URL.replace(/\/$/, "")}/panels/${panelId}`;
  const standardLabel = STANDARD_LABELS[standard] || standard;
  const when = scheduledAt ? scheduledAt.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" }) : null;

  await sendMail({
    to: [to],
    subject: `Interview panel: ${applicantName} (${position})`,
    text: [
      `Hi ${panelistName},`,
      "",
      `You've been added to an interview panel for ${applicantName} (${position}), using the ${standardLabel} interview standard.`,
      when ? `When: ${when}` : "",
      "",
      `Submit your evaluation here: ${link}`,
    ].filter(Boolean).join("\n"),
    html: emailLayout(`
        <h2 style="margin:0 0 8px;">Interview Panel Assignment</h2>
        <p>Hi ${escapeHtml(panelistName)},</p>
        <p>You've been added to an interview panel for <strong>${escapeHtml(applicantName)}</strong> (${escapeHtml(position)}), using the <strong>${escapeHtml(standardLabel)}</strong> interview standard.</p>
        ${when ? `<p><strong>When:</strong> ${escapeHtml(when)}</p>` : ""}
        <p><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Submit your evaluation</a></p>`),
  });
}
