"use client";

import { useCampaign } from "@/stores/campaign-store";
import { runStakeholderEngine, StakeholderAnalysisResult, StakeholderProfile } from "@/lib/stakeholder-engine";
import { fetchStakeholderIntel } from "@/lib/stakeholder-supabase";
import { GroqPersonProfile, GroqStakeholderIntel } from "@/lib/groq-stakeholder";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserCheck, Star, ShieldAlert, TrendingUp, Mail, Presentation, Building2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const ROLE_COLOR: Record<string, string> = {
  "Decision Maker": "var(--blue)",
  "Executive Sponsor": "var(--blue)",
  "Champion": "var(--green)",
  "Budget Owner": "#8b5cf6",
  "Technical Influencer": "var(--amber)",
  "Evaluator": "var(--amber)",
  "Blocker": "#ef4444",
  "End User": "var(--muted)",
};

const ROLE_BG: Record<string, string> = {
  "Decision Maker": "#eff6ff",
  "Executive Sponsor": "#eff6ff",
  "Champion": "#f0fdf4",
  "Budget Owner": "#f5f3ff",
  "Technical Influencer": "#fff7ed",
  "Evaluator": "#fff7ed",
  "Blocker": "#fef2f2",
  "End User": "#f9fafb",
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ background: "var(--line)", borderRadius: 4, height: 6, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

function StakeholderCard({ s }: { s: StakeholderProfile }) {
  const [open, setOpen] = useState(false);
  const color = ROLE_COLOR[s.role] ?? "var(--muted)";
  const bg = ROLE_BG[s.role] ?? "#f9fafb";

  return (
    <motion.div layout className="card stk-card">
      <div className="stk-header">
        <div style={{ flex: 1 }}>
          <h3 className="stk-name">{s.name}</h3>
          <div className="stk-title">{s.title}</div>
          <div className="stk-company"><Building2 size={11} /> {s.company}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <span className="stk-badge" style={{ background: bg, color }}>{s.role}</span>
          <span style={{ fontSize: 11, color: s.sentiment === "Positive" ? "var(--green)" : s.sentiment === "Negative" ? "#ef4444" : "var(--muted)", fontWeight: 700 }}>
            {s.sentiment}
          </span>
        </div>
      </div>

      <div className="stk-scores">
        <div className="stk-score-row">
          <span>Influence</span>
          <span style={{ color, fontWeight: 700 }}>{s.influence_score}</span>
        </div>
        <ScoreBar value={s.influence_score} color={color} />
        <div className="stk-score-row" style={{ marginTop: 8 }}>
          <span>Intent</span>
          <span style={{ color: "var(--green)", fontWeight: 700 }}>{s.intent_score}</span>
        </div>
        <ScoreBar value={s.intent_score} color="var(--green)" />
      </div>

      <div className="stk-topics">
        {s.topics_discussed.slice(0, 4).map((t) => <span key={t} className="tag">{t}</span>)}
      </div>

      <button className="expand-btn" onClick={() => setOpen(!open)}>
        {open ? <><ChevronUp size={13} /> Less</> : <><ChevronDown size={13} /> Why contact</>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <div className="stk-detail">
              <div className="detail-label">Why Contact</div>
              <p className="detail-text">{s.why_contact}</p>
              <div className="detail-label" style={{ marginTop: 10 }}>Pain Points</div>
              <div className="stk-topics">{s.what_problems.map((p) => <span key={p} className="tag tag-red">{p}</span>)}</div>
              <div className="detail-label" style={{ marginTop: 10 }}>Next Best Action</div>
              <p className="detail-text">{s.next_best_action}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
                <span>✉ {s.emails.length} emails</span>
                <span>📅 {s.meetings.length} meetings</span>
                {s.approves_purchases && <span style={{ color: "var(--green)", fontWeight: 700 }}>✓ Approves Purchases</span>}
                {s.is_blocking && <span style={{ color: "#ef4444", fontWeight: 700 }}>⚠ Blocker</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function StakeholderCenter() {
  const { state } = useCampaign() as any;
  const raw = state.agentResults?.stakeholder as {
    mails?: unknown[];
    transcripts?: unknown[];
    groqIntel?: unknown[];
    runId?: string;
  } | undefined;
  const researchCompanies: string[] = useMemo(
    () => (state.agentResults?.research as any)?.companies?.map((c: any) => c.company_profile?.company_name).filter(Boolean) ?? [],
    [state.agentResults?.research]
  );

  const result: StakeholderAnalysisResult | null = useMemo(() => {
    if (!raw?.mails || !raw?.transcripts) return null;
    const companies = researchCompanies.length > 0 ? researchCompanies : ["Infosys", "TCS", "Wipro"];
    return runStakeholderEngine(raw.mails as any, raw.transcripts as any, companies, state.product ?? "Azure AI");
  }, [raw, researchCompanies, state.product]);

  const [selectedCompany, setSelectedCompany] = useState("All");
  const [supabasePeople, setSupabasePeople] = useState<GroqPersonProfile[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  const groqIntelList = useMemo<GroqStakeholderIntel[]>(
    () => (Array.isArray(raw?.groqIntel) ? (raw.groqIntel as GroqStakeholderIntel[]) : []),
    [raw?.groqIntel]
  );

  const companyOptions = useMemo(() => {
    const fromGroq = groqIntelList.map((item) => item.company).filter(Boolean);
    const fromEngine = result?.companies.map((c) => c.company) ?? [];
    return ["All", ...Array.from(new Set([...fromGroq, ...fromEngine]))];
  }, [groqIntelList, result]);

  const selectedGroqIntel = useMemo(() => {
    if (!groqIntelList.length) return null;
    if (selectedCompany === "All") return groqIntelList[0];
    return groqIntelList.find((item) => item.company === selectedCompany) ?? groqIntelList[0];
  }, [groqIntelList, selectedCompany]);

  const activeCompany = selectedCompany === "All" ? selectedGroqIntel?.company ?? companyOptions[1] : selectedCompany;

  useEffect(() => {
    if (!raw?.runId || !activeCompany) {
      setSupabasePeople([]);
      setPeopleLoading(false);
      return;
    }

    let isCancelled = false;
    setPeopleLoading(true);

    fetchStakeholderIntel(raw.runId)
      .then((rows) => {
        if (isCancelled) return;
        const matching = rows.find((item) => item.company === activeCompany);
        setSupabasePeople(matching?.people ?? []);
      })
      .catch(() => {
        if (!isCancelled) setSupabasePeople([]);
      })
      .finally(() => {
        if (!isCancelled) setPeopleLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [raw?.runId, activeCompany]);

  const primaryPeople = supabasePeople.length > 0 ? supabasePeople : selectedGroqIntel?.people ?? [];

  if (!result) {
    return (
      <div className="empty-state">
        <Users size={48} className="empty-icon" />
        <h3>No stakeholder data yet</h3>
        <p>Run a campaign to generate Stakeholder intelligence</p>
        <Link href="/agent-monitor"><button className="primary-button">Run Campaign</button></Link>
        <style jsx>{`
          .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; text-align:center; }
          .empty-icon { color:var(--muted); margin-bottom:20px; }
          h3 { font-family:"Plus Jakarta Sans"; font-size:24px; font-weight:800; margin:0 0 10px; }
          p { color:var(--muted); margin:0 0 24px; }
        `}</style>
      </div>
    );
  }

  const displayCompanies = selectedCompany === "All" ? result.companies : result.companies.filter((c) => c.company === selectedCompany);
  const allStakeholders = displayCompanies.flatMap((c) => c.all_stakeholders);

  const pieData = Object.entries(result.role_distribution).map(([name, value]) => ({
    name, value, fill: ROLE_COLOR[name] ?? "var(--muted)",
  }));

  const signalBarData = result.top_buying_signals.slice(0, 6).map((s) => ({
    name: s.signal.replace("Need ", ""),
    score: s.score,
    confidence: s.confidence,
  }));

  const deptBarData = Object.entries(result.department_distribution).map(([name, value]) => ({ name, value }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stk-container">
      <div className="header-row">
        <div>
          <div className="eyebrow">STAKEHOLDER INTELLIGENCE</div>
          <h1 className="page-title">Stakeholder Mapping</h1>
          <p className="subtle">Buying committee analysis · {result.product} · {result.total_companies} accounts</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="metrics">
        {[
          { label: "Stakeholders", value: result.total_stakeholders, icon: <Users size={15} />, color: "var(--blue)" },
          { label: "Decision Makers", value: result.total_decision_makers, icon: <UserCheck size={15} />, color: "var(--blue)" },
          { label: "Champions", value: result.total_champions, icon: <Star size={15} />, color: "var(--green)" },
          { label: "Buying Signals", value: result.total_buying_signals, icon: <TrendingUp size={15} />, color: "var(--amber)" },
          { label: "Avg Intent", value: `${result.avg_intent_score}%`, icon: <ShieldAlert size={15} />, color: "#8b5cf6" },
          { label: "Avg Confidence", value: `${result.avg_confidence}%`, icon: <Mail size={15} />, color: "var(--green)" },
        ].map((m) => (
          <div key={m.label} className="card">
            <div className="metric-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>{m.label} {m.icon}</div>
            <div className="metric-number" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Company Filter */}
      <div className="filters">
        <button className={`filter-btn ${selectedCompany === "All" ? "active" : ""}`} onClick={() => setSelectedCompany("All")}>All Accounts</button>
        {companyOptions.filter((company) => company !== "All").map((company) => (
          <button key={company} className={`filter-btn ${selectedCompany === company ? "active" : ""}`} onClick={() => setSelectedCompany(company)}>
            {company}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "1.3fr 0.95fr", alignItems: "start" }}>
        <div className="stack">
          <div className="card primary-panel">
            <div className="panel-header">
              <div>
                <div className="eyebrow">PRIMARY ANSWERS</div>
                <h2 className="section-title" style={{ marginBottom: 4 }}>{selectedGroqIntel?.company ?? "Groq LLM synthesis"}</h2>
                <p className="subtle">Groq LLM answers to the 7 sales questions, with people insight pulled from Supabase.</p>
              </div>
              <div className="pill">Groq LLM</div>
            </div>

            {selectedGroqIntel ? (
              <div className="qa-grid">
                {[
                  { key: "who_to_contact", label: "Who to contact", value: selectedGroqIntel.who_to_contact },
                  { key: "why_contact", label: "Why contact", value: selectedGroqIntel.why_contact },
                  { key: "what_problems", label: "What problems", value: selectedGroqIntel.what_problems.join(" • ") },
                  { key: "who_approves", label: "Who approves", value: selectedGroqIntel.who_approves },
                  { key: "who_influences", label: "Who influences", value: selectedGroqIntel.who_influences },
                  { key: "who_blocks", label: "Who blocks", value: selectedGroqIntel.who_blocks },
                  { key: "what_opportunity", label: "Opportunity", value: selectedGroqIntel.what_opportunity },
                ].map((item) => (
                  <div key={item.key} className="qa-card">
                    <div className="qa-label">{item.label}</div>
                    <div className="qa-value">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-qa">Groq answers will appear here once the stakeholder run completes.</div>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="panel-header" style={{ marginBottom: 10 }}>
              <div>
                <div className="eyebrow">PEOPLE TABLE</div>
                <h3 className="card-title">People from Supabase</h3>
              </div>
              <div className="pill">{peopleLoading ? "Loading..." : `${primaryPeople.length} people`}</div>
            </div>
            {primaryPeople.length > 0 ? (
              <div className="people-table-wrap">
                <table className="people-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Influence</th>
                      <th>Source</th>
                      <th>Sentiment</th>
                      <th>Approves</th>
                      <th>Blocks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {primaryPeople.map((person) => (
                      <tr key={`${person.name}-${person.email}`}>
                        <td>{person.name}</td>
                        <td>{person.role}</td>
                        <td>{person.influence_score}</td>
                        <td>{person.source}</td>
                        <td>{person.sentiment}</td>
                        <td>{person.approves_purchases ? "Yes" : "No"}</td>
                        <td>{person.is_blocking ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-qa">No people rows were returned from Supabase for this account yet.</div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h3 className="card-title">Role Distribution</h3>
            <div style={{ height: 240, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sentiment */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">Sentiment</h3>
            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              {[
                { label: "Positive", value: result.sentiment_distribution.positive, color: "var(--green)" },
                { label: "Neutral", value: result.sentiment_distribution.neutral, color: "var(--amber)" },
                { label: "Negative", value: result.sentiment_distribution.negative, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "Plus Jakarta Sans" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dept bar */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">By Department</h3>
            <div style={{ height: 180, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBarData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--blue)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Buying Signals Bar */}
      {signalBarData.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 className="card-title">Top Buying Signals</h3>
          <div style={{ height: 200, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signalBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="score" fill="var(--blue)" radius={[4, 4, 0, 0]} name="Signal Score" />
                <Bar dataKey="confidence" fill="var(--green)" radius={[4, 4, 0, 0]} name="Confidence" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-company analytics */}
      <div className="stack" style={{ marginTop: 20 }}>
        <h2 className="section-title">Account Intelligence</h2>
        <div className="analytics-grid">
          {displayCompanies.map((c) => (
            <div key={c.company} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 className="card-title">{c.company}</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 11, background: "#eff6ff", color: "var(--blue)", padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>
                    Intent {c.overall_intent}%
                  </span>
                  <span style={{ fontSize: 11, background: "#f0fdf4", color: "var(--green)", padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>
                    Opp {c.overall_opportunity}%
                  </span>
                </div>
              </div>
              <div className="analytics-split">
                <div>
                  <div className="metric-label"><Presentation size={13} /> Meetings</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "Plus Jakarta Sans", margin: "6px 0" }}>{c.meeting_count}</div>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{c.meeting_summary}</p>
                </div>
                <div>
                  <div className="metric-label"><Mail size={13} /> Emails</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "Plus Jakarta Sans", margin: "6px 0" }}>{c.email_count}</div>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{c.email_summary}</p>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div className="metric-label">Who to Contact</div>
                <p style={{ fontSize: 13, fontWeight: 700, margin: "4px 0 2px", color: "var(--navy)" }}>{c.who_to_contact}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{c.why_contact}</p>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="metric-label">Next Best Action</div>
                <p style={{ fontSize: 12, color: "var(--navy)", margin: "4px 0 0", background: "var(--canvas)", padding: "8px 10px", borderRadius: 8 }}>{c.next_best_action}</p>
              </div>
              {c.buying_signals.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="metric-label">Active Signals</div>
                  <div className="stk-topics" style={{ marginTop: 6 }}>
                    {c.buying_signals.slice(0, 4).map((s) => <span key={s.signal} className="tag">{s.signal}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .stk-container { padding-bottom: 40px; }
        .section-title { font: 700 18px "Plus Jakarta Sans"; margin: 0 0 16px; }
        .filters { display:flex; gap:10px; margin-bottom:24px; flex-wrap:wrap; }
        .filter-btn { background:#fff; border:1px solid var(--line); padding:8px 16px; border-radius:20px; font-size:13px; font-weight:600; color:var(--muted); cursor:pointer; transition:all 0.2s; }
        .filter-btn:hover { border-color:var(--blue); color:var(--navy); }
        .filter-btn.active { background:var(--blue); color:#fff; border-color:var(--blue); }
        .stakeholder-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
        @media (max-width:1400px) { .stakeholder-grid { grid-template-columns:1fr; } }
        .stk-card { display:flex; flex-direction:column; gap:12px; }
        .stk-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .stk-name { font:700 15px "Plus Jakarta Sans"; margin:0 0 3px; }
        .stk-title { font-size:12px; color:var(--navy); margin-bottom:4px; }
        .stk-company { font-size:11px; color:var(--muted); display:flex; align-items:center; gap:4px; }
        .stk-badge { font-size:10px; font-weight:700; padding:4px 10px; border-radius:20px; white-space:nowrap; }
        .stk-scores { display:flex; flex-direction:column; gap:4px; }
        .stk-score-row { display:flex; justify-content:space-between; font-size:11px; color:var(--muted); }
        .stk-topics { display:flex; flex-wrap:wrap; gap:6px; }
        .expand-btn { background:none; border:1px solid var(--line); border-radius:8px; padding:5px 10px; font-size:11px; font-weight:600; color:var(--muted); cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s; }
        .expand-btn:hover { border-color:var(--blue); color:var(--blue); }
        .stk-detail { padding-top:10px; border-top:1px solid var(--line); }
        .detail-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted); margin-bottom:4px; }
        .detail-text { font-size:12px; color:var(--navy); margin:0; line-height:1.5; }
        .tag-red { background:#fef2f2 !important; color:#ef4444 !important; }
        .primary-panel { border: 1px solid rgba(37, 99, 235, 0.15); box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04); }
        .panel-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .pill { font-size:11px; font-weight:700; color:var(--blue); background:#eff6ff; padding:5px 10px; border-radius:999px; white-space:nowrap; }
        .qa-grid { display:grid; gap:10px; margin-top:16px; }
        .qa-card { background:var(--canvas); border:1px solid var(--line); border-radius:12px; padding:12px 14px; }
        .qa-label { font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:6px; font-weight:700; }
        .qa-value { font-size:13px; color:var(--navy); line-height:1.55; }
        .empty-qa { padding:14px 0 4px; color:var(--muted); font-size:13px; }
        .people-table-wrap { overflow-x:auto; }
        .people-table { width:100%; border-collapse:collapse; font-size:12px; }
        .people-table th, .people-table td { text-align:left; padding:8px 6px; border-bottom:1px solid var(--line); }
        .people-table th { color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:0.05em; font-size:10px; }
        .analytics-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
        @media (max-width:1100px) { .analytics-grid { grid-template-columns:1fr; } }
        .analytics-split { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:14px; padding-bottom:14px; border-bottom:1px solid var(--line); }
      `}</style>
    </motion.div>
  );
}
