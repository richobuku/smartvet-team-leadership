// Minimal iCalendar (RFC 5545) builder — enough for "add to calendar"
// invites with one or two attendees. No external dependency needed.

export interface CalendarAttendee {
  name: string;
  email: string;
}

export interface CalendarEventInput {
  uid: string;
  title: string;
  description?: string;
  start: Date;
  durationMinutes?: number;
  organizer: CalendarAttendee;
  attendees: CalendarAttendee[];
  method?: "REQUEST" | "CANCEL";
}

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// Fold/escape per RFC 5545 §3.3.11 — commas, semicolons, and newlines need escaping.
function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function buildICS(event: CalendarEventInput): string {
  const start = toICSDate(event.start);
  const end = toICSDate(new Date(event.start.getTime() + (event.durationMinutes ?? 30) * 60000));
  const method = event.method ?? "REQUEST";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartVet Performance//Coaching Calendar//EN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }

  lines.push(`ORGANIZER;CN=${escapeText(event.organizer.name)}:mailto:${event.organizer.email}`);
  for (const attendee of event.attendees) {
    lines.push(`ATTENDEE;CN=${escapeText(attendee.name)};RSVP=TRUE:mailto:${attendee.email}`);
  }

  lines.push(
    method === "CANCEL" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  );

  return lines.join("\r\n");
}
