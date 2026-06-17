import { sendMail, emailLayout, escapeHtml } from "./email";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";

// Notifies a reviewer that they've been asked to contribute to a candidate's
// review binder, with a link straight to their review form.
export async function sendBinderInviteEmail(
  to: string,
  reviewerName: string,
  applicantName: string,
  position: string,
  binderId: string
): Promise<void> {
  const link = `${FRONTEND_URL.replace(/\/$/, "")}/binders/${binderId}`;

  await sendMail({
    to: [to],
    subject: `Candidate review: ${applicantName} (${position})`,
    text: [
      `Hi ${reviewerName},`,
      "",
      `You've been asked to review ${applicantName} (${position}) ahead of their interview.`,
      "Please share your summary, strengths/concerns, and any probing questions the interview panel should ask.",
      "",
      `Submit your review here: ${link}`,
    ].join("\n"),
    html: emailLayout(`
        <h2 style="margin:0 0 8px;">Candidate Review Request</h2>
        <p>Hi ${escapeHtml(reviewerName)},</p>
        <p>You've been asked to review <strong>${escapeHtml(applicantName)}</strong> (${escapeHtml(position)}) ahead of their interview.</p>
        <p>Please share your summary, strengths/concerns, and any probing questions the interview panel should ask.</p>
        <p><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Submit your review</a></p>`),
  });
}
