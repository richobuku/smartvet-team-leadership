import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import logo from "../assets/logo.png";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing verification token.");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err.message || "Verification failed.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-light p-8 text-center">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="SmartVet" className="h-20 w-20 rounded-full object-cover mb-3" />
          <h1 className="font-display text-2xl font-extrabold text-navy mb-1">SmartVet Team Leadership System</h1>
        </div>

        {status === "loading" && <p className="text-navy/60">Verifying your email...</p>}

        {status === "success" && (
          <>
            <p className="text-statusGreen font-semibold mb-2">Email verified!</p>
            <p className="text-sm text-navy/60 mb-4">Your account is now active. You can log in below.</p>
            <Link to="/login" className="inline-block bg-primary text-white rounded-full px-6 py-2 font-semibold hover:bg-primary/90 transition-colors">
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-statusRed font-semibold mb-2">Verification failed</p>
            <p className="text-sm text-navy/60 mb-4">{error}</p>
            <Link to="/login" className="text-primary text-sm font-semibold hover:underline">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
