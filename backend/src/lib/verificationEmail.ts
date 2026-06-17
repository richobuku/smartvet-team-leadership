import { sendMail, emailLayout, escapeHtml } from "./email";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";

// Sends the "click to verify" email for a newly-created account. The link
// points at the frontend's /verify-email page, which calls the backend
// verification endpoint and then redirects to login.
export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL.replace(/\/$/, "")}/verify-email?token=${token}`;

  await sendMail({
    to: [to],
    subject: "Verify your SmartVet Team Leadership System account",
    text: [
      `Hi ${name},`,
      "",
      "An account has been created for you on the SmartVet Team Leadership System.",
      "Please verify your email address before you can log in:",
      "",
      link,
      "",
      "This link expires in 48 hours.",
    ].join("\n"),
    html: emailLayout(`
        <h2 style="margin:0 0 8px;">Welcome to SmartVet Team Leadership System</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>An account has been created for you. Please verify your email address before you can log in.</p>
        <p><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Verify my email</a></p>
        <p style="color:#6b7280;font-size:13px;">If the button doesn't work, copy this link into your browser:<br>${link}</p>
        <p style="color:#6b7280;font-size:13px;">This link expires in 48 hours.</p>`),
  });
}
