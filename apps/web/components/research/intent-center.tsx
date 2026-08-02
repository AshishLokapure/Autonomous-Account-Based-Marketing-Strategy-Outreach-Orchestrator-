"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Target, TrendingUp, Clock3, ShieldAlert, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useCampaign } from "@/stores/campaign-store";

type IntentSignal = {
  signal: string;
  weight: number;
  source: string;
  confidence: number;
};

type KeywordMatch = {
  keyword: string;
  category: string;
  occurrences: number;
};

type IntentCompany = {
  company_name: string;
  intent_score: number;
  intent_level: string;
  purchase_probability: number;
  confidence: number;
  buying_stage: string;
  purchase_window: string;
  urgency: string;
  recommended_priority: string;
  recommended_action: string;
  predicted_timeline: string;
  positive_signals: IntentSignal[];
  negative_signals: IntentSignal[];
  matched_keywords: KeywordMatch[];
  explanation?: { line_items?: string[] };
};

type IntentData = {
  product: string;
  totals?: {
    average_intent_score?: number;
    high_intent_accounts?: number;
    average_purchase_probability?: number;
    average_confidence?: number;
    expected_revenue_opportunity?: number;
    average_buying_window?: string;
  };
  companies?: IntentCompany[];
};

const LEVEL_COLORS: Record<string, string> = {
  "Very High": "var(--green)",
  High: "var(--blue)",
  Medium: "var(--amber)",
  Low: "#fb7185",
  "Very Low": "#ef4444",
};

export function IntentCenter() {
  const { state } = useCampaign() as { state: { agentResults?: { intent?: IntentData } } };
  const data = state.agentResults?.intent;
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const companies = useMemo<IntentCompany[]>(() => data?.companies ?? [], [data]);
  const activeCompany = selectedCompany ? companies.find((company) => company.company_name === selectedCompany) : companies[0];

  if (!data) {
    return (
      <div className="empty-state">
        <Activity size={48} className="empty-icon" />
        <h3>No intent signals detected</h3>
        <p>Run a campaign to generate explainable intent scoring.</p>
        <Link href="/agent-monitor"><button className="primary-button">Run Campaign</button></Link>
      </div>
    );
  }

  const levelData: Array<{ name: string; score: number; fill: string }> = companies.map((company) => ({
    name: company.company_name,
    score: company.intent_score,
    fill: LEVEL_COLORS[company.intent_level] ?? "var(--blue)",
  }));

  const distribution: Array<{ name: string; value: number; fill: string }> = [
    { name: "High Intent", value: companies.filter((company) => company.intent_score >= 71).length, fill: "var(--green)" },
    { name: "Medium Intent", value: companies.filter((company) => company.intent_score >= 51 && company.intent_score < 71).length, fill: "var(--amber)" },
    { name: "Low Intent", value: companies.filter((company) => company.intent_score < 51).length, fill: "#ef4444" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="intent-container">
      <div className="header-row">
        <div>
          <div className="eyebrow">INTENT CENTER</div>
          <h1 className="page-title">Intent Signals</h1>
          <p className="subtle">Rule-based purchase prediction for {data.product}</p>
        </div>
      </div>

      <div className="metrics intent-metrics">
        <div className="card"><div className="metric-label">Average Intent Score <Target size={16} /></div><div className="metric-number">{data.totals?.average_intent_score ?? 0}</div></div>
        <div className="card"><div className="metric-label">High Intent Accounts <TrendingUp size={16} /></div><div className="metric-number" style={{ color: "var(--green)" }}>{data.totals?.high_intent_accounts ?? 0}</div></div>
        <div className="card"><div className="metric-label">Average Purchase Probability <BriefcaseBusiness size={16} /></div><div className="metric-number">{data.totals?.average_purchase_probability ?? 0}%</div></div>
        <div className="card"><div className="metric-label">Average Confidence <ShieldAlert size={16} /></div><div className="metric-number">{data.totals?.average_confidence ?? 0}%</div></div>
        <div className="card"><div className="metric-label">Expected Revenue Opportunity</div><div className="metric-number">${Math.round(data.totals?.expected_revenue_opportunity ?? 0).toLocaleString()}</div></div>
        <div className="card"><div className="metric-label">Average Buying Window <Clock3 size={16} /></div><div className="metric-number" style={{ fontSize: 26 }}>{data.totals?.average_buying_window ?? "Unknown"}</div></div>
      </div>

      <div className="dashboard-grid custom-grid">
        <div className="card">
          <h3 className="card-title">Intent Score by Account</h3>
          <div style={{ height: 320, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {levelData.map((entry: { name: string; score: number; fill: string }, index: number) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Intent Distribution</h3>
          <div style={{ height: 320, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92}>
                  {distribution.map((entry: { name: string; value: number; fill: string }, index: number) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="filters" style={{ marginTop: 20 }}>
        {companies.map((company) => (
          <button key={company.company_name} className={`filter-btn ${activeCompany?.company_name === company.company_name ? "active" : ""}`} onClick={() => setSelectedCompany(company.company_name)}>
            {company.company_name}
          </button>
        ))}
      </div>

      {activeCompany && (
        <div className="dashboard-grid detail-grid" style={{ marginTop: 20 }}>
          <div className="stack">
            <div className="card">
              <h3 className="card-title">{activeCompany.company_name}</h3>
              <p className="card-subtitle">{activeCompany.buying_stage} · {activeCompany.recommended_priority} priority · {activeCompany.predicted_timeline}</p>
              <div className="score-strip">
                <div><span className="metric-label">Intent Score</span><div className="metric-number">{activeCompany.intent_score}</div></div>
                <div><span className="metric-label">Purchase Probability</span><div className="metric-number">{activeCompany.purchase_probability}%</div></div>
                <div><span className="metric-label">Urgency</span><div className="metric-number" style={{ fontSize: 28 }}>{activeCompany.urgency}</div></div>
              </div>
              <p className="detail-copy">{activeCompany.recommended_action}</p>
              <div className="line-items">
                {(activeCompany.explanation?.line_items ?? []).map((item: string) => <div key={item} className="line-item">{item}</div>)}
              </div>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3 className="card-title">Matched Keywords</h3>
              <div className="tag-cloud">
                {(activeCompany.matched_keywords ?? []).map((keyword: KeywordMatch) => (
                  <span key={`${keyword.keyword}-${keyword.category}`} className="tag">{keyword.keyword} · {keyword.occurrences}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="stack">
            <div className="card">
              <h3 className="card-title">Positive Signals</h3>
              <div className="signal-list">
                {(activeCompany.positive_signals ?? []).map((signal: IntentSignal) => (
                  <div key={`${signal.signal}-${signal.source}`} className="signal-row positive">
                    <strong>{signal.signal}</strong>
                    <span>{signal.weight}</span>
                    <span>{signal.source}</span>
                    <span>{signal.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3 className="card-title">Negative Signals</h3>
              <div className="signal-list">
                {(activeCompany.negative_signals ?? []).map((signal: IntentSignal) => (
                  <div key={`${signal.signal}-${signal.source}`} className="signal-row negative">
                    <strong>{signal.signal}</strong>
                    <span>{signal.weight}</span>
                    <span>{signal.source}</span>
                    <span>{signal.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; text-align:center; }
        .empty-icon { color:var(--muted); margin-bottom:20px; }
        .intent-metrics { grid-template-columns: repeat(3, 1fr); }
        .custom-grid, .detail-grid { grid-template-columns: 1.4fr 1fr; }
        .filters { display:flex; flex-wrap:wrap; gap:10px; }
        .filter-btn { background:#fff; border:1px solid var(--line); border-radius:999px; padding:8px 14px; font-size:12px; font-weight:700; color:var(--muted); }
        .filter-btn.active { background:var(--blue); color:#fff; border-color:var(--blue); }
        .score-strip { display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin:18px 0; }
        .detail-copy { margin:0; color:var(--navy); line-height:1.6; }
        .line-items, .signal-list, .tag-cloud { display:flex; flex-direction:column; gap:10px; margin-top:14px; }
        .line-item { background:#f8fafc; border:1px solid var(--line); border-radius:10px; padding:10px 12px; font-size:12px; color:var(--navy); }
        .signal-row { display:grid; grid-template-columns: 1.3fr 0.5fr 0.8fr 0.5fr; gap:10px; align-items:center; border-radius:10px; padding:10px 12px; font-size:12px; }
        .signal-row.positive { background:#f0fdf4; color:#166534; }
        .signal-row.negative { background:#fef2f2; color:#991b1b; }
        .tag-cloud { flex-direction:row; flex-wrap:wrap; }
        @media (max-width: 1100px) {
          .intent-metrics, .custom-grid, .detail-grid, .score-strip { grid-template-columns:1fr; }
        }
      `}</style>
    </motion.div>
  );
}
