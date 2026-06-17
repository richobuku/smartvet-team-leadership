import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { useAuth } from "../../context/AuthContext";
import { BINDER_STATUS_LABELS } from "../../lib/interviewStandards";

const STAGE_LABELS = {
  received: "Received",
  shortlisted: "Shortlisted",
  interview_1: "1st Interview",
  interview_2: "2nd Interview",
  hired: "Hired",
  rejected: "Rejected",
};

export default function MyBinders() {
  const { user } = useAuth();
  const [binders, setBinders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/binders").then(setBinders).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-sm text-statusRed">{error}</p>;
  if (!binders) return <p className="text-navy/60 text-sm">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Candidate Reviews</h1>
        <p className="text-sm text-navy/60">Pre-interview reviews you've been asked to contribute to.</p>
      </div>

      {binders.length === 0 ? (
        <p className="text-sm text-navy/50">You haven't been asked to review any candidates.</p>
      ) : (
        <div className="space-y-3">
          {binders.map((binder) => {
            const mine = binder.contributions.find((c) => c.user.id === user.id);
            return (
              <Link
                key={binder.id}
                to={`/binders/${binder.id}`}
                className="block bg-white rounded-xl shadow-sm border border-light p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold text-navy">{binder.applicant.name} — {binder.applicant.position}</p>
                    <p className="text-xs text-navy/40 mt-0.5">{STAGE_LABELS[binder.stage]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mine?.submittedAt ? (
                      <StatusPill status="green" label="Submitted" />
                    ) : (
                      <StatusPill status="yellow" label="Action needed" />
                    )}
                    <StatusPill status={binder.status === "completed" ? "green" : "yellow"} label={BINDER_STATUS_LABELS[binder.status]} />
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
