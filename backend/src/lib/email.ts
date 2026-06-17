import nodemailer from "nodemailer";
import path from "path";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "SmartVet Performance <noreply@smartvet.africa>";

// Inline-embedded via CID so the logo renders in email clients that block
// remote images and regardless of what FRONTEND_URL points at.
const LOGO_CID = "smartvet-logo";
const LOGO_PATH = path.join(__dirname, "..", "assets", "email-logo.png");

// Escapes user-supplied text before interpolating it into email HTML templates.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Wraps email body HTML with a shared header bearing the SmartVet logo, so
// every email feels consistent and on-brand.
export function emailLayout(bodyHtml: string): string {
  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;background:#f5f5f5;">
      <div style="background:#fff;padding:24px 24px 0;text-align:center;border-bottom:1px solid #f0f0f0;">
        <img src="cid:${LOGO_CID}" alt="SmartVet" width="72" height="72" style="display:inline-block;margin-bottom:16px;">
      </div>
      <div style="background:#fff;padding:24px;">
        ${bodyHtml}
      </div>
    </div>`;
}

const transporter = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export interface MailOptions {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  icalEvent?: { method: "REQUEST" | "CANCEL"; content: string; filename?: string };
}

// Best-effort send: failures are logged, never thrown, so a missing/broken
// SMTP config can't block the API request that triggered the notification.
export async function sendMail(opts: MailOptions): Promise<boolean> {
  if (!transporter) {
    console.log(`[email] SMTP not configured — skipping email "${opts.subject}" to ${opts.to.join(", ")}`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: opts.to.join(", "),
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.html
        ? [{ filename: "logo.png", path: LOGO_PATH, cid: LOGO_CID }]
        : undefined,
      icalEvent: opts.icalEvent
        ? {
            method: opts.icalEvent.method,
            filename: opts.icalEvent.filename || "invite.ics",
            content: opts.icalEvent.content,
          }
        : undefined,
    });
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${opts.subject}" to ${opts.to.join(", ")}:`, err);
    return false;
  }
}
