"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        return;
      }
      localStorage.setItem("fm_token", data.token);
      // Cookie for middleware (8h expiry matches JWT)
      document.cookie = `fm_token=${data.token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`;
      router.push("/jobs");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Network error: ${msg} — API: ${API}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f8fafc", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 16,
        padding: "40px 44px", width: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: "#1d4ed8",
            border: "2px solid #1d4ed8", borderRadius: 7, padding: "5px 14px", letterSpacing: 0.5,
          }}>
            FLOORMANAGER
          </span>
          <p style={{ marginTop: 16, fontSize: 13, color: "#6b7280", marginBottom: 0 }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 12px",
                border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14,
                fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#111827",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#1d4ed8")}
              onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 12px",
                border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14,
                fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#111827",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#1d4ed8")}
              onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
          </div>

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7,
              padding: "9px 12px", fontSize: 13, color: "#b91c1c",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, background: loading ? "#93c5fd" : "#1d4ed8", color: "#fff",
              border: "none", borderRadius: 8, padding: "11px", fontSize: 14,
              fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
