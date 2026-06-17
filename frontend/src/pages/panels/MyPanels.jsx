import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { formatDate } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { STANDARD_LABELS, PANEL_DECISION_LABELS, PANEL_STATUS_LABELS } from "../../lib/interviewStandards";

const STAGE_LABELS = {
  received: "Received",
  shortlisted: "Shortlisted",
  interview_1: "1st Interview",
  interview_2: "2nd Interview",
  hired: "Hired",
  rejected: "Rejected",
};

export default function MyPanels() {
  const { user } = useAuth();
  const [panels, setPanels] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/panels").then(setPanels).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-sm text-statusRed">{error}</p>;
  if (!panels) return <p className="text-navy/60 text-sm">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Interview Panels</h1>
        <p className="text-sm text-navy/60">Panels you've been asked to evaluate.</p>
      </div>

      {panels.length === 0 ? (
        <p className="text-sm text-navy/50">You haven't been assigned to any interview panels.</p>
      ) : (
        <div className="space-y-3">
          {panels.map((panel) => {
            const mine = panel.members.find((m) => m.user.id === user.id);
            return (
              <Link
                key={panel.id}
                to={`/panels/${panel.id}`}
                className="block bg-white rounded-xl shadow-sm border border-light p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold text-navy">{panel.applicant.name} — {panel.applicant.position}</p>
                    <p className="text-xs text-navy/40 mt-0.5">
                      {STAGE_LABELS[panel.stage]} · {STANDARD_LABELS[panel.standard]} standard
                      {panel.scheduledAt ? ` · ${formatDate(panel.scheduledAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mine?.submittedAt ? (
                      <StatusPill
                        status={["strong_yes", "yes"].includes(mine.decision) ? "green" : "red"}
                        label={`You: ${PANEL_DECISION_LABELS[mine.decision]}`}
                      />
                    ) : (
                      <StatusPill status="yellow" label="Action needed" />
                    )}
                    <StatusPill status={panel.status === "completed" ? "green" : "yellow"} label={PANEL_STATUS_LABELS[panel.status]} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
