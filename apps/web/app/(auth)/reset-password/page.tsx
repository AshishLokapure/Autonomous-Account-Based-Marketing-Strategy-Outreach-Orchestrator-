"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push("/login?message=Password+updated+successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f8fc", padding: 20, fontFamily: '"DM Sans", Arial, sans-serif' }}>
      <section className="card" style={{ width: "100%", maxWidth: 420, padding: 32, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
        <div className="brand" style={{ color: "#0f172a", padding: 0, marginBottom: 28, display: "flex", gap: 11, alignItems: "center", font: '800 19px "Plus Jakarta Sans"' }}>
          <div className="brand-mark" style={{ display: "grid", placeItems: "center", width: 31, height: 31, borderRadius: 10, background: "linear-gradient(135deg, #5b8cff, #2e5ad6)", color: "#fff" }}>
            <Sparkles size={17} />
          </div>
          <b>AccountPilot</b>
        </div>
        <div className="eyebrow" style={{ fontSize: 10, fontWeight: 800, color: "#2563eb", letterSpacing: 1 }}>NEW PASSWORD</div>
        <h1 className="page-title" style={{ font: '800 24px "Plus Jakarta Sans"', letterSpacing: "-1px", margin: "6px 0 8px" }}>Set new password</h1>
        <p className="subtle" style={{ color: "#64748b", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          Enter your new password below.
        </p>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleReset}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
            New password
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7, padding: "0 12px", height: 44, border: "1px solid #dce2eb", borderRadius: 10, color: "#94a3b8" }}>
              <LockKeyhole size={17} />
              <input
                aria-label="New password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ border: 0, outline: 0, flex: 1, color: "#0f172a", fontSize: 13 }}
                required
              />
            </div>
          </label>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginTop: 14 }}>
            Confirm new password
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7, padding: "0 12px", height: 44, border: "1px solid #dce2eb", borderRadius: 10, color: "#94a3b8" }}>
              <LockKeyhole size={17} />
              <input
                aria-label="Confirm new password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ border: 0, outline: 0, flex: 1, color: "#0f172a", fontSize: 13 }}
                required
              />
            </div>
          </label>
          <button
            className="primary-button"
            type="submit"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: 22, height: 44, border: 0, borderRadius: 10, background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            {loading ? "Updating..." : "Update Password"} <ArrowRight size={16} />
          </button>
        </form>
      </section>
    </main>
  );
}
