import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";

export default function SignupPage() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: name + password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const { completeSignup } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    setLoading(true);
    try {
      await apiClient.post("/auth/send-otp", { email: email.trim() });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp.trim()) return;
    setLoading(true);
    try {
      await apiClient.post("/auth/verify-otp", { email, otp: otp.trim() });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setResendMessage("");
    try {
      await apiClient.post("/auth/resend-otp", { email });
      setResendMessage("A new code has been sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !password) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'~`]/.test(password);
    if (!hasSymbol) {
      setError("Password must contain at least one symbol");
      return;
    }

    setLoading(true);
    try {
      await completeSignup(email, name.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl text-paper-soft">CollabMind</h1>
          <p className="text-sm text-text-muted mt-1">
            {step === 1 && "Create your account"}
            {step === 2 && "Verify your email"}
            {step === 3 && "Choose your name and password"}
          </p>
        </div>

        <div className="rounded-lg bg-ink-soft/50 p-6 border border-white/5">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-mono uppercase tracking-wide text-text-muted">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="rounded-md bg-paper text-text-primary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-md bg-amber text-ink font-medium text-sm py-2.5 hover:bg-amber-dim transition-colors disabled:opacity-50"
              >
                {loading ? "Sending code..." : "Send verification code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <p className="text-xs text-text-muted -mt-2">
                We sent a 6-digit code to <span className="text-paper-soft">{email}</span>
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-mono uppercase tracking-wide text-text-muted">Verification code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="rounded-md bg-paper text-text-primary px-3 py-2 text-sm tracking-widest outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted"
                />
              </label>
              {resendMessage && (
                <p className="text-xs text-amber">{resendMessage}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-md bg-amber text-ink font-medium text-sm py-2.5 hover:bg-amber-dim transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-xs text-signal hover:underline"
              >
                Resend code
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleCompleteSignup} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-mono uppercase tracking-wide text-text-muted">Full name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-md bg-paper text-text-primary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-signal placeholder:text-text-muted"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-mono uppercase tracking-wide text-text-muted">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-md bg-paper text-text-primary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-signal"
                />
                <span className="text-[11px] text-text-muted">
                  At least 8 characters, including 1 symbol
                </span>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-md bg-amber text-ink font-medium text-sm py-2.5 hover:bg-amber-dim transition-colors disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-signal hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}