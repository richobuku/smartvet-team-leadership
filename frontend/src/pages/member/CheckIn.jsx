import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { formatDate } from "../../lib/format";

export default function CheckIn() {
  const { user } = useAuth();
  const [bigWin, setBigWin] = useState("");
  const [blocker, setBlocker] = useState("");
  const [needsHelp, setNeedsHelp] = useState(false);
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get(`/checkins/user/${user.id}`).then(setHistory).catch(() => {});
  }, [user, submitted]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/checkins", { bigWin, blocker, needsHelp, notes });
      setBigWin("");
      setBlocker("");
      setNeedsHelp(false);
      setNotes("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-navy">Daily Check-In</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Big win today?</label>
          <input
            value={bigWin}
            onChange={(e) => setBigWin(e.target.value)}
            className="w-full rounded-lg border border-light px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. Confirmed 50 farmers via phone"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">One blocker?</label>
          <input
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            className="w-full rounded-lg border border-light px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. Network issues in the field"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="needsHelp"
            type="checkbox"
            checked={needsHelp}
            onChange={(e) => setNeedsHelp(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="needsHelp" className="text-sm text-navy">Do you need help?</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-light px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {error && <p className="text-sm text-statusRed">{error}</p>}
        {submitted && <p className="text-sm text-statusGreen">Check-in recorded. Your manager will review it.</p>}
        <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 font-semibold hover:bg-primary/90 transition-colors">
          Submit Check-In
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Recent Check-Ins</h2>
        {history.length === 0 ? (
          <p className="text-sm text-navy/50">No check-ins yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((c) => (
              <li key={c.id} className="text-sm border-b border-light/60 pb-2">
                <p className="text-navy/40 text-xs">{formatDate(c.date)}</p>
                {c.bigWin && <p className="text-navy/80">Win: {c.bigWin}</p>}
                {c.blocker && <p className="text-navy/80">Blocker: {c.blocker}</p>}
                {c.needsHelp && <p className="text-statusRed font-semibold">Requested help</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
