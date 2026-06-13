import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-light p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="SmartVet" className="h-20 w-20 rounded-full object-cover mb-3" />
          <h1 className="font-display text-2xl font-extrabold text-navy mb-1">SmartVet Performance</h1>
          <p className="text-sm text-navy/60">Growth-focused team performance management</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-light px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@smartvet.africa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-light px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-statusRed">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-full py-2 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p className="text-xs text-white/50 mt-6">
          Demo accounts (password: password123): grace@smartvet.africa (member), amara@smartvet.africa (leader),
          richard.ceo@smartvet.africa (executive), admin@smartvet.africa (admin)
        </p>
      </div>
    </div>
  );
}
