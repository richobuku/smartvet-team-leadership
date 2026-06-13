import { formatDate } from "../lib/format";

export default function CelebrationFeed({ celebrations }) {
  if (!celebrations || celebrations.length === 0) {
    return <p className="text-sm text-navy/50">No celebrations logged yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {celebrations.map((c) => (
        <li key={c.id} className="rounded-lg bg-statusGreen/5 border border-statusGreen/20 p-3">
          <p className="text-sm font-semibold text-navy">
            🎉 {c.user?.name}: {c.achievement}
          </p>
          {c.impact && <p className="text-xs text-navy/70 mt-1">{c.impact}</p>}
          <p className="text-xs text-navy/40 mt-1">{formatDate(c.date)}</p>
        </li>
      ))}
    </ul>
  );
}
