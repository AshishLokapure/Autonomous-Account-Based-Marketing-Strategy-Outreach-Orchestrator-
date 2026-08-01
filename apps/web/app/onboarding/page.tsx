"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Globe2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import styles from "./onboarding.module.css";

const industries = [
  "Software / SaaS",
  "FinTech",
  "Healthcare",
  "E-commerce",
  "Technology",
  "Banking & Finance",
  "Telecommunications",
  "Manufacturing",
  "Retail",
  "Education",
  "Logistics",
  "Other",
];

const companySizes = [
  "1–50",
  "51–200",
  "201–500",
  "501–1000",
  "1001–5000",
  "5000+",
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, refreshWorkspace } = useAuth();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [companySize, setCompanySize] = useState("51–200");

  const toggleIndustry = (ind: string) =>
    setSelectedIndustries(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    );
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company / Workspace Name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("User not authenticated.");
      }

      // 1. Create workspace
      const { data: workspaceData, error: wsError } = await supabase
        .from("workspaces")
        .insert({
          name: name.trim(),
          website: website.trim() || null,
          industry: selectedIndustries.join(", "),
          company_size: companySize,
          country: country.trim() || null,
        })
        .select("id")
        .single();

      if (wsError) throw wsError;

      // 2. Add owner membership
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspaceData.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      await refreshWorkspace();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <a href="/dashboard" className={styles.brand}>
          <span>
            <Sparkles size={17} />
          </span>
          AccountPilot AI
        </a>
        <span className={styles.secure}>Workspace Setup</span>
      </header>

      <section className={styles.card} style={{ maxWidth: 640 }}>
        <div className={styles.stepContent} style={{ padding: "40px 48px" }}>
          <div className={styles.heading}>
            <span>WORKSPACE CREATION</span>
            <h1>Create your workspace</h1>
            <p>Tell us about your organization to personalize your account intelligence workspace.</p>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 18 }}>
              <label className={styles.fieldLabel}>
                Company / Workspace Name *
                <input
                  className={styles.input}
                  placeholder="e.g. Northstar Revenue"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className={styles.fieldLabel}>
                Company website (optional)
                <input
                  className={styles.input}
                  placeholder="https://northstarrevenue.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>

              <div className={styles.gridTwo}>
                <div className={styles.fieldLabel}>
                  Industry <span style={{ color: "#94a3b8", fontWeight: 400 }}>(select all that apply)</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {industries.map(ind => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => toggleIndustry(ind)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 20,
                          border: selectedIndustries.includes(ind) ? "1.5px solid #2563eb" : "1.5px solid #dce2eb",
                          background: selectedIndustries.includes(ind) ? "#eff6ff" : "#fff",
                          color: selectedIndustries.includes(ind) ? "#2563eb" : "#64748b",
                          fontSize: 12,
                          fontWeight: selectedIndustries.includes(ind) ? 700 : 500,
                          cursor: "pointer",
                          transition: "0.15s",
                        }}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <label className={styles.fieldLabel}>
                  Company size
                  <span className={styles.selectWrap}>
                    <select
                      className={styles.input}
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                    >
                      {companySizes.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz} employees
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </div>

              <label className={styles.fieldLabel}>
                Country (optional)
                <input
                  className={styles.input}
                  placeholder="e.g. United States, India"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </label>
            </div>

            <button
              className={styles.primaryButton}
              type="submit"
              disabled={loading}
              style={{ marginTop: 28, width: "100%", justifyContent: "center" }}
            >
              {loading ? "Creating workspace..." : "Create Workspace & Continue"} <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
