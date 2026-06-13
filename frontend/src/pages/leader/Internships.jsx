import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { formatDate } from "../../lib/format";

const DECISIONS = ["pending", "recommend_hire", "extend", "end_internship"];
const DECISION_LABELS = {
  pending: "Pending",
  recommend_hire: "Recommend hire",
  extend: "Extend internship",
  end_internship: "End internship",
};

export default function Internships() {
  const [internships, setInternships] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");

  function refresh() {
    api.get("/internships").then((data) => {
      setInternships(data);
      const next = {};
      for (const i of data) next[i.id] = { conversionDecision: i.conversionDecision, conversionNotes: i.conversionNotes || "" };
      setDrafts(next);
    });
  }

  useEffect(refresh, []);

  function updateDraft(id, field, value) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
  }

  async function handleSave(id) {
    setError("");
    try {
      await api.put(`/internships/${id}`, drafts[id]);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Internship Review</h1>

      {error && <p className="text-sm text-statusRed">{error}</p>}

      {internships.length === 0 ? (
        <p className="text-navy/60 text-sm">You are not supervising any interns.</p>
      ) : (
        <div className="space-y-4">
          {internships.map((i) => (
            <div key={i.id} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Link to={`/internships/${i.id}`} className="font-semibold text-navy hover:text-primary hover:underline">{i.user.name}</Link>
                  <p className="text-sm text-navy/60">{i.track} · {i.user.team?.name}</p>
                </div>
                <p className="text-sm text-navy/60">{formatDate(i.startDate)} – {formatDate(i.plannedEndDate)}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Conversion Decision</label>
                  <select
                    value={drafts[i.id]?.conversionDecision || "pending"}
                    onChange={(e) => updateDraft(i.id, "conversionDecision", e.target.value)}
                    className="w-full rounded-lg border border-light px-3 py-2"
                  >
                    {DECISIONS.map((d) => (
                      <option key={d} value={d}>{DECISION_LABELS[d]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Notes</label>
                  <textarea
                    value={drafts[i.id]?.conversionNotes || ""}
                    onChange={(e) => updateDraft(i.id, "conversionNotes", e.target.value)}
                    rows={1}
                    className="w-full rounded-lg border border-light px-3 py-2"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSave(i.id)}
                className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Save Decision
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
