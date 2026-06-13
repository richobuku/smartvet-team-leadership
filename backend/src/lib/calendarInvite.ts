import { sendMail, emailLayout } from "./email";
import { buildICS, CalendarAttendee } from "./calendar";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";
const EMAIL_FROM_ADDRESS = (process.env.EMAIL_FROM || "noreply@smartvet.africa").replace(/^.*<(.+)>$/, "$1");

export interface CalendarInviteInput {
  uid: string;
  title: string;
  description?: string;
  start: Date;
  durationMinutes?: number;
  attendees: CalendarAttendee[];
  linkPath?: string;
}

// Sends a calendar invite (.ics) to every attendee — typically the mentor
// and mentee on a 1-on-1, coaching follow-up, feedback follow-up, or growth
// plan milestone. Opening the .ics adds the event to the recipient's
// calendar app and serves as the initial reminder.
export async function sendCalendarInvite(input: CalendarInviteInput): Promise<void> {
  if (input.attendees.length === 0) return;

  const ics = buildICS({
    uid: input.uid,
    title: input.title,
    description: input.description,
    start: input.start,
    durationMinutes: input.durationMinutes,
    organizer: { name: "SmartVet Performance", email: EMAIL_FROM_ADDRESS },
    attendees: input.attendees,
    method: "REQUEST",
  });

  const when = input.start.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
  const link = input.linkPath ? `${FRONTEND_URL.replace(/\/$/, "")}${input.linkPath}` : null;

  const recipients = input.attendees.map((a) => a.email).filter(Boolean);
  if (recipients.length === 0) return;

  await sendMail({
    to: recipients,
    subject: `Calendar invite: ${input.title}`,
    text: [
      `${input.title}`,
      `When: ${when}`,
      input.description ? `\n${input.description}` : "",
      link ? `\nDetails: ${link}` : "",
      "\nA calendar invite (.ics) is attached — accept it to add this to your calendar. You'll also get an email reminder closer to the date.",
    ].filter(Boolean).join("\n"),
    html: emailLayout(`
        <h2 style="margin:0 0 8px;">${input.title}</h2>
        <p style="margin:0 0 4px;"><strong>When:</strong> ${when}</p>
        ${input.description ? `<p style="white-space:pre-wrap;color:#374151;">${input.description}</p>` : ""}
        ${link ? `<p><a href="${link}" style="color:#2563eb;">Open in SmartVet Performance →</a></p>` : ""}
        <p style="color:#6b7280;font-size:13px;">A calendar invite (.ics) is attached — accept it to add this to your calendar. You'll also get an email reminder closer to the date.</p>`),
    icalEvent: { method: "REQUEST", content: ics, filename: "invite.ics" },
  });
}

// Sends a same-day/upcoming reminder email (no .ics — the invite already
// added it to their calendar; this is just a nudge).
export async function sendCalendarReminder(input: {
  title: string;
  description?: string;
  start: Date;
  attendees: CalendarAttendee[];
  linkPath?: string;
}): Promise<void> {
  const recipients = input.attendees.map((a) => a.email).filter(Boolean);
  if (recipients.length === 0) return;

  const when = input.start.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
  const link = input.linkPath ? `${FRONTEND_URL.replace(/\/$/, "")}${input.linkPath}` : null;

  await sendMail({
    to: recipients,
    subject: `Reminder: ${input.title}`,
    text: [
      `Reminder — ${input.title}`,
      `When: ${when}`,
      input.description ? `\n${input.description}` : "",
      link ? `\nDetails: ${link}` : "",
    ].filter(Boolean).join("\n"),
    html: emailLayout(`
        <h2 style="margin:0 0 8px;">Reminder: ${input.title}</h2>
        <p style="margin:0 0 4px;"><strong>When:</strong> ${when}</p>
        ${input.description ? `<p style="white-space:pre-wrap;color:#374151;">${input.description}</p>` : ""}
        ${link ? `<p><a href="${link}" style="color:#2563eb;">Open in SmartVet Performance →</a></p>` : ""}`),
  });
}
