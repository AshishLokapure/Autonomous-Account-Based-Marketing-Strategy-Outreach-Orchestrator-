"use client";

import { useState } from "react";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please try again.");
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
        <div className="eyebrow" style={{ fontSize: 10, fontWeight: 800, color: "#2563eb", letterSpacing: 1 }}>ACCOUNT RECOVERY</div>
        <h1 className="page-title" style={{ font: '800 24px "Plus Jakarta Sans"', letterSpacing: "-1px", margin: "6px 0 8px" }}>Reset your password</h1>

        {submitted ? (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", padding: "14px", borderRadius: 10, fontSize: 13, margin: "16px 0" }}>
            Check your email! We&apos;ve sent a password reset link to <strong>{email}</strong>.
          </div>
        ) : (
          <>
            <p className="subtle" style={{ color: "#64748b", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              We&apos;ll send a secure reset link to your work email.
            </p>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                Work email
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7, padding: "0 12px", height: 44, border: "1px solid #dce2eb", borderRadius: 10, color: "#94a3b8" }}>
                  <Mail size={17} />
                  <input
                    aria-label="Work email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                {loading ? "Sending..." : "Send reset link"} <ArrowRight size={16} />
              </button>
            </form>
          </>
        )}

        <p className="subtle" style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "#64748b" }}>
          <a href="/login" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>Return to sign in</a>
        </p>
      </section>
    </main>
  );
}
