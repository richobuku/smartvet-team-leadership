import { useEffect, useState } from "react";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import AlertBanner from "../../components/AlertBanner";
import { formatDate } from "../../lib/format";

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/analytics/company").then(setData);
  }, []);

  if (!data) return <p className="text-navy/60">Loading company overview...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Company Performance</h1>
        <p className="text-navy/60 text-sm">Week of {formatDate(data.week)}</p>
      </div>

      {data.alerts.churnRisk.length > 0 && (
        <div className="space-y-2">
          {data.alerts.churnRisk.map((u) => (
            <AlertBanner key={u.id} variant="red">
              <strong>CRITICAL:</strong> {u.name} ({u.team}) is flagged as a high churn risk after 2+ red weeks. A check-in should be scheduled.
            </AlertBanner>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Company Scorecard</h2>
        <div className="overflow-x-auto">
<table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-navy/50 border-b border-light">
              <th className="py-2 pr-2">Team</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Members</th>
              <th className="py-2 pr-2">On Track</th>
              <th className="py-2 pr-2">Reviews Submitted</th>
            </tr>
          </thead>
          <tbody>
            {data.teams.map((t) => (
              <tr key={t.id} className="border-b border-light/60">
                <td className="py-2 pr-2 font-medium text-navy">{t.name}</td>
                <td className="py-2 pr-2"><StatusPill status={t.status} label={t.status.toUpperCase()} /></td>
                <td className="py-2 pr-2 text-navy/70">{t.memberCount}</td>
                <td className="py-2 pr-2 text-navy/70">{t.onTrack} of {t.memberCount}</td>
                <td className="py-2 pr-2 text-navy/70">{t.submitted} of {t.memberCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Internship Pipeline</h2>
        {data.internshipPipeline.active === 0 ? (
          <p className="text-sm text-navy/50">No active interns.</p>
        ) : (
          <>
            <div className="flex gap-6 mb-3 text-sm">
              <p><span className="font-bold text-navy text-lg">{data.internshipPipeline.active}</span> <span className="text-navy/60">active</span></p>
              <p><span className="font-bold text-statusGreen text-lg">{data.internshipPipeline.recommendHire}</span> <span className="text-navy/60">recommended for hire</span></p>
              <p><span className="font-bold text-statusYellow text-lg">{data.internshipPipeline.pending}</span> <span className="text-navy/60">decision pending</span></p>
            </div>
            <div className="overflow-x-auto">
<table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-navy/50 border-b border-light">
                  <th className="py-2 pr-2">Intern</th>
                  <th className="py-2 pr-2">Team</th>
                  <th className="py-2 pr-2">Track</th>
                  <th className="py-2 pr-2">Supervisor</th>
                  <th className="py-2 pr-2">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.internshipPipeline.interns.map((i) => (
                  <tr key={i.id} className="border-b border-light/60">
                    <td className="py-2 pr-2 font-medium text-navy">{i.name}</td>
                    <td className="py-2 pr-2 text-navy/70">{i.team}</td>
                    <td className="py-2 pr-2 text-navy/70">{i.track}</td>
                    <td className="py-2 pr-2 text-navy/70">{i.supervisor}</td>
                    <td className="py-2 pr-2 text-navy/70">{i.conversionDecision.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Team Leader Performance</h2>
        <div className="overflow-x-auto">
<table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-navy/50 border-b border-light">
              <th className="py-2 pr-2">Team Leader</th>
              <th className="py-2 pr-2">Team</th>
              <th className="py-2 pr-2">1-on-1 Completion Rate</th>
              <th className="py-2 pr-2">Open Feedback Conversations</th>
            </tr>
          </thead>
          <tbody>
            {data.teamLeaderPerformance.map((l) => (
              <tr key={l.id} className="border-b border-light/60">
                <td className="py-2 pr-2 font-medium text-navy">{l.name}</td>
                <td className="py-2 pr-2 text-navy/70">{l.team}</td>
                <td className="py-2 pr-2 text-navy/70">{l.oneOnOneCompletionRate == null ? "—" : `${l.oneOnOneCompletionRate}%`}</td>
                <td className="py-2 pr-2 text-navy/70">{l.openFeedbackCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <h2 className="text-lg font-semibold text-navy mb-3">High Performers</h2>
          {data.highPerformers.length === 0 ? (
            <p className="text-sm text-navy/50">No data submitted for this week yet.</p>
          ) : (
            <ol className="space-y-2">
              {data.highPerformers.map((p, i) => (
                <li key={p.userId} className="flex items-center justify-between text-sm">
                  <span className="text-navy">{i + 1}. {p.name} <span className="text-navy/40">({p.teamName})</span></span>
                  <span className="font-mono font-semibold text-statusGreen">{p.pct.toFixed(1)}%</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <h2 className="text-lg font-semibold text-navy mb-3">Go/No-Go Gates</h2>
          {data.goNoGoGates.length === 0 ? (
            <p className="text-sm text-navy/50">No evaluation frameworks configured.</p>
          ) : (
            <ul className="space-y-3">
              {data.goNoGoGates.map((fw, i) => (
                <li key={i}>
                  <p className="font-semibold text-navy text-sm">{fw.frameworkName}</p>
                  <ul className="text-sm text-navy/70 ml-4 list-disc">
                    {(fw.gates || []).map((g, j) => (
                      <li key={j}>Month {g.month}: {g.criteria}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
