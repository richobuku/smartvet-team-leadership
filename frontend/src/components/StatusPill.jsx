import { STATUS_COLORS } from "../lib/format";

export default function StatusPill({ status, label }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.green;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colors.light} ${colors.text}`}>
      <span className={`h-2 w-2 rounded-full ${colors.bg}`} />
      {label || colors.label}
    </span>
  );
}
