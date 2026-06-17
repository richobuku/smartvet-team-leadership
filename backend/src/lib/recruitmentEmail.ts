import { sendMail, emailLayout, escapeHtml } from "./email";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";

const STAGE_CONTENT: Record<string, { subject: string; heading: string; body: string }> = {
  received: {
    subject: "Application received",
    heading: "Thanks for applying!",
    body: "We've received your application and our team is reviewing it. We'll be in touch with next steps soon.",
  },
  shortlisted: {
    subject: "You've been shortlisted",
    heading: "Good news — you've been shortlisted",
    body: "Your application stood out and you've been shortlisted for the next stage. We'll reach out shortly to schedule an interview.",
  },
  interview_1: {
    subject: "Interview invitation",
    heading: "You're invited for an interview",
    body: "We'd like to invite you for a first-round interview. Our team will be in touch to confirm the date and time.",
  },
  interview_2: {
    subject: "Second interview invitation",
    heading: "You're invited for a second interview",
    body: "Congratulations on progressing! We'd like to invite you for a second-round interview. Our team will be in touch to confirm the date and time.",
  },
  hired: {
    subject: "Welcome to the team!",
    heading: "Congratulations — you've been hired!",
    body: "We're excited to offer you a position with us. A separate email with your account details will follow shortly.",
  },
  rejected: {
    subject: "Update on your application",
    heading: "Thank you for your interest",
    body: "Thank you for taking the time to apply. After careful consideration, we will not be moving forward with your application at this time. We wish you the best in your search.",
  },
};

// Sends a stage-change notification to an applicant. Best-effort — failures
// are swallowed by sendMail, never block the stage-change request.
export async function sendApplicantStageEmail(to: string, name: string, stage: string): Promise<void> {
  const content = STAGE_CONTENT[stage];
  if (!content || !to) return;

  await sendMail({
    to: [to],
    subject: content.subject,
    text: [`Hi ${name},`, "", content.body].join("\n"),
    html: emailLayout(`
        <h2 style="margin:0 0 8px;">${content.heading}</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>${content.body}</p>`),
  });
}

// Sends a hired applicant their new account credentials. A separate email
// from sendVerificationEmail (which the new User account triggers as well).
export async function sendHireWelcomeEmail(to: string, name: string, tempPassword: string): Promise<void> {
  const loginLink = `${FRONTEND_URL.replace(/\/$/, "")}/login`;

  await sendMail({
    to: [to],
    subject: "Your SmartVet Performance account",
    text: [
      `Hi ${name},`,
      "",
      "Welcome to the team! Your account has been created.",
      `Email: ${to}`,
      `Temporary password: ${tempPassword}`,
      "",
      "Please verify your email (see the separate verification email) and then log in. We recommend changing your password after your first login.",
      loginLink,
    ].join("\n"),
    html: emailLayout(`
        <h2 style="margin:0 0 8px;">Welcome to the team!</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your SmartVet Performance account has been created.</p>
        <p><strong>Email:</strong> ${escapeHtml(to)}<br><strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p>
        <p>Please verify your email using the link in the separate verification email, then log in below. We recommend changing your password after your first login.</p>
        <p><a href="${loginLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Log in</a></p>`),
  });
}
