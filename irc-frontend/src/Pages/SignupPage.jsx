import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl text-paper-soft">CollabMind</h1>
          <p className="text-sm text-text-muted mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-ink-soft/50 p-6 border border-white/5">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

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
            <span className="text-xs font-mono uppercase tracking-wide text-text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
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
          </label>

          <button
            type="submit"
            className="mt-2 rounded-md bg-amber text-ink font-medium text-sm py-2.5 hover:bg-amber-dim transition-colors"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-signal hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}