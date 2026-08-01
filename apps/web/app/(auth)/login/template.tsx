"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LoginTemplate({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        // Check workspace membership
        const { data: member } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", data.user.id)
          .limit(1)
          .maybeSingle();

        if (member) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google sign in.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="showcase-inner">
          <a className="login-brand" href="/dashboard">
            <span>
              <Sparkles size={18} />
            </span>
            AccountPilot
          </a>
          <div className="login-copy">
            <div className="login-kicker">AUTONOMOUS REVENUE INTELLIGENCE</div>
            <h1>
              Know every account.
              <br />
              <em>Win every moment.</em>
            </h1>
            <p>AccountPilot gives enterprise teams the trusted intelligence to turn account signals into timely, relevant action.</p>
          </div>
          <div className="moment-card">
            <div className="moment-heading">
              <i>
                <BarChart3 size={17} />
              </i>
              <span>ACCOUNT MOMENT</span>
              <b>
                <small /> LIVE
              </b>
            </div>
            <h2>Novartis has a high-intent expansion signal</h2>
            <p>Three verified signals point to an active AI infrastructure initiative.</p>
            <div className="signal-row">
              <CheckCircle2 size={15} />
              <span>Pricing review requested</span>
              <strong>92/100</strong>
            </div>
          </div>
          <div className="trust">
            <ShieldCheck size={15} /> Built for teams that value secure, verifiable intelligence.
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="mobile-brand">
          <span>
            <Sparkles size={17} />
          </span>
          AccountPilot
        </div>
        <div className="login-form">
          <div className="login-kicker">WELCOME BACK</div>
          <h2>Sign in to AccountPilot</h2>
          <p>Enter your details to access your account intelligence workspace.</p>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label>
              Work email
              <div className="field">
                <Mail size={17} />
                <input
                  aria-label="Work email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>
            <label>
              Password
              <a href="/forgot-password">Forgot password?</a>
              <div className="field">
                <LockKeyhole size={17} />
                <input
                  aria-label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label className="remember">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Keep me signed in for 14 days
            </label>
            <button className="submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to workspace"} <ArrowRight size={17} />
            </button>
          </form>

          <div className="or">
            <span>OR CONTINUE WITH</span>
          </div>

          <button className="google" type="button" onClick={handleGoogleLogin}>
            <b>G</b> Continue with Google
          </button>

          <div className="signup">
            Don&apos;t have an account? <a href="/register">Create account</a>
          </div>
        </div>
        <footer>
          © 2026 AccountPilot AI <span>•</span> <a href="#privacy">Privacy</a> <span>•</span> <a href="#terms">Terms</a>
        </footer>
      </section>
      <div className="route-content">{children}</div>
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(420px, 1.08fr) minmax(460px, 0.92fr);
          background: #fff;
          font-family: "DM Sans", Arial, sans-serif;
          color: #0f172a;
        }
        .login-showcase {
          position: relative;
          overflow: hidden;
          background: #0f172a;
          color: #fff;
          padding: 44px clamp(45px, 7vw, 112px);
        }
        .login-showcase:before {
          content: "";
          position: absolute;
          width: 620px;
          height: 620px;
          right: -250px;
          top: -220px;
          border-radius: 50%;
          background: radial-gradient(circle, #2563eb99 0%, #2563eb10 46%, transparent 70%);
        }
        .login-showcase:after {
          content: "";
          position: absolute;
          width: 480px;
          height: 480px;
          left: -285px;
          bottom: -270px;
          border-radius: 50%;
          background: radial-gradient(circle, #14b8a666 0%, #14b8a610 50%, transparent 72%);
        }
        .showcase-inner {
          position: relative;
          z-index: 1;
          max-width: 550px;
          min-height: calc(100vh - 88px);
          display: flex;
          flex-direction: column;
        }
        .login-brand,
        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
          text-decoration: none;
          font: 800 19px "Plus Jakarta Sans", sans-serif;
          letter-spacing: -0.7px;
        }
        .login-brand span,
        .mobile-brand span {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          border-radius: 10px;
          background: linear-gradient(135deg, #5b8cff, #2e5ad6);
          box-shadow: 0 8px 22px #2e5ad655;
        }
        .login-copy {
          margin-top: auto;
          padding-top: 70px;
        }
        .login-kicker {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.35px;
          color: #7ea2ff;
        }
        .login-copy h1 {
          font: 800 clamp(34px, 4vw, 54px) / 1.08 "Plus Jakarta Sans", sans-serif;
          letter-spacing: -2.4px;
          margin: 15px 0 18px;
        }
        .login-copy h1 em {
          font-style: normal;
          background: linear-gradient(100deg, #77a3ff, #61e0d0);
          background-clip: text;
          color: transparent;
        }
        .login-copy > p {
          max-width: 470px;
          margin: 0;
          color: #bdc8da;
          font-size: 15px;
          line-height: 1.65;
        }
        .moment-card {
          margin-top: 42px;
          padding: 18px;
          border: 1px solid #40516f;
          background: #182641cc;
          backdrop-filter: blur(10px);
          border-radius: 16px;
          box-shadow: 0 18px 48px #02061740;
        }
        .moment-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #a9bad8;
        }
        .moment-heading i {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border-radius: 8px;
          background: #254985;
          color: #8eb0ff;
        }
        .moment-heading b {
          margin-left: auto;
          color: #6ee7b7;
          font-size: 10px;
          letter-spacing: 0.4px;
        }
        .moment-heading b small {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #34d399;
          border-radius: 50%;
          margin: 0 4px 1px 0;
        }
        .moment-card h2 {
          font: 700 15px "Plus Jakarta Sans", sans-serif;
          margin: 15px 0 5px;
        }
        .moment-card p {
          margin: 0;
          color: #aebcd3;
          font-size: 12px;
        }
        .signal-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 0 0;
          margin-top: 14px;
          border-top: 1px solid #36445f;
          color: #e2e8f0;
          font-size: 12px;
        }
        .signal-row svg {
          color: #5eead4;
        }
        .signal-row strong {
          margin-left: auto;
          color: #6ee7b7;
        }
        .trust {
          display: flex;
          gap: 7px;
          align-items: center;
          color: #91a3c2;
          font-size: 11px;
          margin: 25px 0 0;
        }
        .trust svg {
          color: #60a5fa;
        }
        .login-panel {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #fff;
          padding: 45px clamp(35px, 7vw, 105px) 28px;
        }
        .login-form {
          width: 100%;
          max-width: 390px;
          margin: auto;
        }
        .login-form h2 {
          font: 800 28px "Plus Jakarta Sans", sans-serif;
          letter-spacing: -1.2px;
          margin: 10px 0 9px;
        }
        .login-form > p {
          margin: 0 0 28px;
          color: #64748b;
          font-size: 13.5px;
          line-height: 1.55;
        }
        .login-form form {
          display: grid;
          gap: 18px;
        }
        .login-form label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }
        .login-form label > a {
          float: right;
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
        }
        .field {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 7px;
          padding: 0 12px;
          height: 46px;
          border: 1px solid #dce2eb;
          border-radius: 10px;
          color: #94a3b8;
          transition: 0.2s;
        }
        .field:focus-within {
          border-color: #5b8cff;
          box-shadow: 0 0 0 3px #2563eb14;
        }
        .field input {
          border: 0;
          outline: 0;
          flex: 1;
          min-width: 0;
          color: #0f172a;
          font-size: 13px;
        }
        .field input::placeholder {
          color: #a9b3c2;
        }
        .field button {
          display: grid;
          place-items: center;
          border: 0;
          background: transparent;
          color: #94a3b8;
          padding: 2px;
          cursor: pointer;
        }
        .remember {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b !important;
          font-weight: 500 !important;
          font-size: 12px !important;
          margin-top: -3px;
        }
        .remember input {
          accent-color: #2563eb;
          width: 14px;
          height: 14px;
        }
        .submit {
          height: 47px;
          border: 0;
          border-radius: 10px;
          background: #2563eb;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          box-shadow: 0 10px 22px #2563eb2e;
          cursor: pointer;
          transition: 0.2s;
        }
        .submit:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }
        .submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .or {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          margin: 25px 0 15px;
        }
        .or:before,
        .or:after {
          content: "";
          height: 1px;
          background: #e8edf4;
          flex: 1;
        }
        .google {
          width: 100%;
          height: 45px;
          border: 1px solid #dce2eb;
          border-radius: 10px;
          background: #fff;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
        }
        .google:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .google b {
          font: 800 17px Arial;
          color: #4285f4;
        }
        .signup {
          text-align: center;
          color: #64748b;
          font-size: 12px;
          margin: 24px 0 0;
        }
        .signup a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 800;
        }
        .login-panel footer {
          margin-top: auto;
          display: flex;
          justify-content: center;
          gap: 9px;
          color: #94a3b8;
          font-size: 10px;
        }
        .login-panel footer a {
          color: #64748b;
          text-decoration: none;
        }
        .mobile-brand {
          display: none;
          color: #0f172a;
        }
        .mobile-brand span {
          color: #fff;
        }
        .route-content {
          display: none;
        }
        @media (max-width: 850px) {
          .login-page {
            grid-template-columns: 1fr;
          }
          .login-showcase {
            display: none;
          }
          .login-panel {
            padding: 32px 24px 24px;
          }
          .mobile-brand {
            display: flex;
            margin-bottom: 50px;
          }
          .login-form {
            margin: 0 auto;
          }
          .login-panel footer {
            margin-top: 60px;
          }
        }
      `}</style>
    </main>
  );
}
