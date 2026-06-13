import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { formatDate, isoDate } from "../../lib/format";
import { ONE_ON_ONE_TYPES, ONE_ON_ONE_TYPE_LABELS, AGENDAS } from "../../lib/agendas";

const STATUS_PILL = {
  scheduled: "yellow",
  completed: "green",
  missed: "red",
};

function listToText(list) {
  return (list || []).join("\n");
}
function textToList(text) {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function OneOnOnes() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [oneOnOnes, setOneOnOnes] = useState([]);
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [type, setType] = useState("weekly");
  const [scheduledAt, setScheduledAt] = useState(isoDate(new Date()));
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState({ notes: "", actionItems: "", recapNotes: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.teamId) return;
    api.get(`/teams/${user.teamId}/members`).then((mems) => {
      const teamMembers = mems.filter((m) => m.role === "team_member");
      setMembers(teamMembers);
      if (!userId && teamMembers.length > 0) setUserId(teamMembers[0].id);
    });
    refresh();
  }, [user]);

  function refresh() {
    api.get("/oneonones").then(setOneOnOnes);
  }

  async function handleSchedule(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/oneonones", { userId, type, scheduledAt });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function openOneOnOne(o) {
    setSelectedId(o.id);
    setDraft({
      notes: o.notes || "",
      actionItems: listToText(o.actionItems),
      recapNotes: o.recapNotes || "",
    });
    setSaved(false);
  }

  const selected = oneOnOnes.find((o) => o.id === selectedId);

  async function handleSaveDraft() {
    await api.put(`/oneonones/${selectedId}`, {
      notes: draft.notes,
      actionItems: textToList(draft.actionItems),
      recapNotes: draft.recapNotes,
    });
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleComplete() {
    await api.post(`/oneonones/${selectedId}/complete`, {
      notes: draft.notes,
      actionItems: textToList(draft.actionItems),
      recapNotes: draft.recapNotes,
    });
    refresh();
    setSelectedId(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">1-on-1s</h1>

      <form onSubmit={handleSchedule} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">Schedule a 1-on-1</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Person</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2">
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2">
              {ONE_ON_ONE_TYPES.map((t) => (
                <option key={t} value={t}>{ONE_ON_ONE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Date</label>
            <input type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
        </div>
        {error && <p className="text-sm text-statusRed">{error}</p>}
        <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Schedule
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">All 1-on-1s</h2>
        {oneOnOnes.length === 0 ? (
          <p className="text-sm text-navy/50">No 1-on-1s scheduled yet.</p>
        ) : (
          <ul className="divide-y divide-light/60">
            {oneOnOnes.map((o) => (
              <li key={o.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-navy">{o.user.name} · {ONE_ON_ONE_TYPE_LABELS[o.type]}</p>
                  <p className="text-xs text-navy/40">{formatDate(o.scheduledAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={STATUS_PILL[o.status]} label={o.status} />
                  <button onClick={() => openOneOnOne(o)} className="text-sm font-semibold text-primary hover:underline">
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-navy">
              {selected.user.name} — {ONE_ON_ONE_TYPE_LABELS[selected.type]} 1-on-1 ({formatDate(selected.scheduledAt)})
            </h2>
            <button onClick={() => setSelectedId(null)} className="text-sm text-navy/50 hover:text-navy">Close</button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-navy mb-2">Suggested Agenda</h3>
            <ul className="list-disc list-inside text-sm text-navy/70 space-y-1">
              {AGENDAS[selected.type].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Notes</label>
            <textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} rows={4} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Action items (one per line)</label>
            <textarea value={draft.actionItems} onChange={(e) => setDraft((d) => ({ ...d, actionItems: e.target.value }))} rows={3} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Recap notes</label>
            <textarea value={draft.recapNotes} onChange={(e) => setDraft((d) => ({ ...d, recapNotes: e.target.value }))} rows={2} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>

          {saved && <p className="text-sm text-statusGreen">Saved.</p>}

          <div className="flex gap-3">
            <button onClick={handleSaveDraft} className="bg-white border border-light text-navy rounded-lg px-4 py-2 text-sm font-semibold hover:bg-light transition-colors">
              Save Draft
            </button>
            {selected.status !== "completed" && (
              <button onClick={handleComplete} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
                Mark Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
