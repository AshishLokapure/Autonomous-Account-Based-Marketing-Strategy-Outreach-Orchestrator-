"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f8fc", padding: 20 }}>
      <section className="card" style={{ width: "100%", maxWidth: 420, padding: 32 }}>
        <div className="brand" style={{ color: "#0f172a", padding: 0, marginBottom: 28 }}>
          <div className="brand-mark"><Sparkles size={17} /></div>
          <b>AccountPilot</b>
        </div>
        <div className="eyebrow">WELCOME BACK</div>
        <h1 className="page-title">Sign in to your workspace</h1>
        <p className="subtle" style={{ marginBottom: 24 }}>Use your enterprise account to access account intelligence.</p>
        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>Work email
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7, padding: "0 12px", height: 44, border: "1px solid #dce2eb", borderRadius: 10, color: "#94a3b8" }}>
              <Mail size={16} />
              <input aria-label="Work email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ border: 0, outline: 0, flex: 1, fontSize: 13, color: "#0f172a" }} />
            </div>
          </label>
          <label style={{ fontSize: 12, fontWeight: 700 }}>Password
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7, padding: "0 12px", height: 44, border: "1px solid #dce2eb", borderRadius: 10, color: "#94a3b8" }}>
              <LockKeyhole size={16} />
              <input aria-label="Password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ border: 0, outline: 0, flex: 1, fontSize: 13, color: "#0f172a" }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ border: 0, background: "transparent", cursor: "pointer", color: "#94a3b8", display: "grid", placeItems: "center" }}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </label>
          <button type="submit" disabled={loading} style={{ height: 45, border: 0, borderRadius: 10, background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? "Signing in..." : "Sign in securely"} <ArrowRight size={16} />
          </button>
        </form>
        <div style={{ display: "flex", alignItems: "center", gap: 11, color: "#94a3b8", fontSize: 10, fontWeight: 800, letterSpacing: "0.8px", margin: "20px 0 12px" }}>
          <span style={{ flex: 1, height: 1, background: "#e8edf4" }} /><span>OR</span><span style={{ flex: 1, height: 1, background: "#e8edf4" }} />
        </div>
        <button type="button" onClick={handleGoogle} style={{ width: "100%", height: 43, border: "1px solid #dce2eb", borderRadius: 10, background: "#fff", color: "#334155", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
          <b style={{ font: "800 17px Arial", color: "#4285f4" }}>G</b> Continue with Google
        </button>
        <p className="subtle" style={{ textAlign: "center", marginTop: 18 }}>New to AccountPilot? <a href="/register" style={{ color: "#2563eb", fontWeight: 700 }}>Create an account</a></p>
      </section>
    </main>
  );
}
