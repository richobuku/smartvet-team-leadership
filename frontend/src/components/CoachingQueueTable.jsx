import { Link } from "react-router-dom";
import StatusPill from "./StatusPill";

export default function CoachingQueueTable({ members }) {
  const flagged = members.filter((m) => m.status === "yellow" || m.status === "red" || m.churnRisk === "high");

  if (flagged.length === 0) {
    return <p className="text-sm text-navy/50">Nobody needs coaching this week. 🎉</p>;
  }

  return (
    <>
      <table className="hidden md:table w-full text-sm">
        <thead>
          <tr className="text-left text-navy/50 border-b border-light">
            <th className="py-2 pr-2">Person</th>
            <th className="py-2 pr-2">Status</th>
            <th className="py-2 pr-2">Issue</th>
            <th className="py-2 pr-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {flagged.map((m) => (
            <tr key={m.id} className="border-b border-light/60">
              <td className="py-2 pr-2 font-medium text-navy">{m.name}</td>
              <td className="py-2 pr-2"><StatusPill status={m.status || "yellow"} /></td>
              <td className="py-2 pr-2 text-navy/70">
                {m.churnRisk === "high" ? "Churn risk" : m.status === "red" ? "Below 80% of target" : "Slightly below target"}
              </td>
              <td className="py-2 pr-2">
                <Link to={`/leader/coaching?userId=${m.id}`} className="text-secondary hover:underline mr-3">Log Coaching</Link>
                <Link to={`/leader/team`} className="text-secondary hover:underline">View Metrics</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="md:hidden flex flex-col gap-2">
        {flagged.map((m) => (
          <div key={m.id} className="border border-light rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-navy">{m.name}</span>
              <StatusPill status={m.status || "yellow"} />
            </div>
            <p className="text-navy/70 text-sm">
              {m.churnRisk === "high" ? "Churn risk" : m.status === "red" ? "Below 80% of target" : "Slightly below target"}
            </p>
            <div className="flex gap-3 text-sm">
              <Link to={`/leader/coaching?userId=${m.id}`} className="text-secondary hover:underline">Log Coaching</Link>
              <Link to={`/leader/team`} className="text-secondary hover:underline">View Metrics</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
