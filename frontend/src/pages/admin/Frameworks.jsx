import { useEffect, useState } from "react";
import { api } from "../../api/client";

export default function Frameworks() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [frameworks, setFrameworks] = useState([]);

  useEffect(() => {
    api.get("/teams").then((ts) => {
      setTeams(ts);
      if (ts.length > 0) setTeamId(ts[0].id);
    });
  }, []);

  useEffect(() => {
    if (!teamId) return;
    api.get(`/frameworks/team/${teamId}`).then(setFrameworks);
  }, [teamId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Evaluation Frameworks</h1>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Team</label>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full sm:w-72 rounded-lg border border-light px-3 py-2">
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {frameworks.length === 0 ? (
        <p className="text-sm text-navy/50">No evaluation framework defined for this team yet.</p>
      ) : (
        frameworks.map((fw) => (
          <div key={fw.id} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-navy">{fw.name}</h2>
              <p className="text-sm text-navy/70">{fw.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-navy mb-2">Weekly / Monthly KPIs</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-navy/50 border-b border-light">
                    <th className="py-1 pr-2">KPI</th>
                    <th className="py-1 pr-2">Target</th>
                    <th className="py-1 pr-2">Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {(fw.kpis || []).map((k, i) => (
                    <tr key={i} className="border-b border-light/60">
                      <td className="py-1 pr-2 text-navy">{k.name}</td>
                      <td className="py-1 pr-2 text-navy/70">{k.target}</td>
                      <td className="py-1 pr-2 text-navy/70">{k.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-navy mb-1">Status System</h3>
              <p className="text-sm text-navy/70">{fw.trafficLightLogic}</p>
            </div>

            {fw.goNoGoGates && (
              <div>
                <h3 className="text-sm font-semibold text-navy mb-1">Go/No-Go Gates</h3>
                <ul className="text-sm text-navy/70 list-disc ml-5">
                  {fw.goNoGoGates.map((g, i) => (
                    <li key={i}>Month {g.month}: {g.criteria}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
