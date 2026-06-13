import { Link } from "react-router-dom";
import StatusPill from "./StatusPill";
import { pctToTarget } from "../lib/format";

export default function StatusCard({ name, role, status, actual, target, churnRisk, linkTo, footer }) {
  const pct = target ? pctToTarget(actual, target) : null;

  const card = (
    <div className="bg-white rounded-xl shadow-sm border border-light p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-navy">{name}</p>
          {role && <p className="text-xs text-navy/60">{role}</p>}
        </div>
        <StatusPill status={status} />
      </div>
      {pct != null && (
        <p className="text-sm text-navy/70 font-mono">{pct}% toward target</p>
      )}
      {churnRisk === "high" && (
        <p className="mt-1 text-xs font-semibold text-statusRed">⚠ Churn risk: HIGH</p>
      )}
      {footer}
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{card}</Link>;
  }
  return card;
}
