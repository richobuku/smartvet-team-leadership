import { STATUS_COLORS, formatNumber, pctToTarget } from "../lib/format";

export default function ProgressBar({ name, target, actual, unit, status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.green;
  const pct = pctToTarget(actual, target);
  const widthPct = Math.min(pct, 100);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="font-medium text-navy">{name}</span>
        <span className="font-mono text-navy/70">
          {formatNumber(actual, unit)} / {formatNumber(target, unit)} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-light overflow-hidden">
        <div className={`h-full rounded-full ${colors.bg}`} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  );
}
