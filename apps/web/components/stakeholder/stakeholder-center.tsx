"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Star, ShieldAlert, Building2, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { useCampaign } from "@/stores/campaign-store";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";

const ROLE_COLORS: Record<string, string> = {
  decision_maker: "var(--blue)",
  champion: "var(--green)",
  influencer: "var(--amber)",
  blocker: "#ef4444",
};

export function StakeholderCenter() {
  const { state } = useCampaign() as any;
  const data = state.agentResults?.stakeholder as any;

  if (!data) {
    return (
      <div className="empty-state">
        <Users size={48} className="empty-icon" />
        <h3>No stakeholder data yet</h3>
        <p>Run a campaign to generate stakeholder intelligence.</p>
        <Link href="/agent-monitor"><button className="primary-button">Run Campaign</button></Link>
      </div>
    );
  }

  const companies = data.companies ?? [];
  const allStakeholders = companies.flatMap((company: any) => company.stakeholders ?? []);
  const roleCounts = allStakeholders.reduce((acc: Record<string, number>, stakeholder: any) => {
    acc[stakeholder.type] = (acc[stakeholder.type] ?? 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(roleCounts).map(([name, value]) => ({
    name,
    value,
    fill: ROLE_COLORS[name] ?? "var(--muted)",
  }));

  const companyBarData = companies.map((company: any) => ({
    name: company.company_name,
    stakeholders: company.buying_committee_size,
    meetings: company.meeting_analytics?.meetings_held ?? 0,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stk-container">
      <div className="header-row">
        <div>
          <div className="eyebrow">STAKEHOLDER INTELLIGENCE</div>
          <h1 className="page-title">Stakeholder Mapping</h1>
          <p className="subtle">Deterministic buying committee analysis for {data.product}</p>
        </div>
      </div>

      <div className="metrics">
        <div className="card"><div className="metric-label">Stakeholders <Users size={15} /></div><div className="metric-number">{data.totals?.stakeholders_mapped ?? 0}</div></div>
        <div className="card"><div className="metric-label">Decision Makers <UserCheck size={15} /></div><div className="metric-number" style={{ color: "var(--blue)" }}>{data.totals?.decision_makers ?? 0}</div></div>
        <div className="card"><div className="metric-label">Champions <Star size={15} /></div><div className="metric-number" style={{ color: "var(--green)" }}>{data.totals?.champions ?? 0}</div></div>
        <div className="card"><div className="metric-label">Blockers <ShieldAlert size={15} /></div><div className="metric-number" style={{ color: "#ef4444" }}>{data.totals?.blockers ?? 0}</div></div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <h3 className="card-title">Role Distribution</h3>
          <div style={{ height: 260, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4}>
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Committee Size by Company</h3>
          <div style={{ height: 260, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyBarData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="stakeholders" fill="var(--blue)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="stack" style={{ marginTop: 20 }}>
        <h2 className="section-title">Company Breakdown</h2>
        <div className="analytics-grid">
          {companies.map((company: any) => (
            <div key={company.company_name} className="card company-card">
              <div className="company-head">
                <div>
                  <h3 className="card-title">{company.company_name}</h3>
                  <p className="card-subtitle">Buying committee size: {company.buying_committee_size}</p>
                </div>
                <span className="tag"><Building2 size={12} /> {company.email_analytics?.threads_analyzed ?? 0} threads</span>
              </div>
              <div className="split-grid">
                <div>
                  <div className="metric-label"><BriefcaseBusiness size={13} /> Meeting sentiment</div>
                  <div className="metric-number" style={{ fontSize: 28 }}>{company.meeting_analytics?.avg_sentiment}</div>
                  <p className="mini-copy">Meetings held: {company.meeting_analytics?.meetings_held ?? 0}</p>
                </div>
                <div>
                  <div className="metric-label">Last contact</div>
                  <div className="metric-number" style={{ fontSize: 24 }}>{company.email_analytics?.last_contact ?? "Unknown"}</div>
                  <p className="mini-copy">Reply rate: {company.email_analytics?.reply_rate ?? 0}%</p>
                </div>
              </div>
              <div className="topic-row">
                {(company.meeting_analytics?.key_topics ?? []).map((topic: string) => <span key={topic} className="tag">{topic}</span>)}
              </div>
              <div className="stakeholder-list">
                {(company.stakeholders ?? []).map((stakeholder: any) => (
                  <div key={`${company.company_name}-${stakeholder.name}`} className="stakeholder-row">
                    <div>
                      <strong>{stakeholder.name}</strong>
                      <div className="mini-copy">{stakeholder.title}</div>
                    </div>
                    <div className="stakeholder-meta">
                      <span className={`role-pill ${stakeholder.type}`}>{stakeholder.type.replace("_", " ")}</span>
                      <span className="mini-copy">{stakeholder.influence}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; text-align:center; }
        .empty-icon { color:var(--muted); margin-bottom:20px; }
        .stk-container { padding-bottom: 40px; }
        .section-title { font: 700 18px "Plus Jakarta Sans"; margin: 0 0 16px; }
        .analytics-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
        .company-card { display:flex; flex-direction:column; gap:14px; }
        .company-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .split-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        .mini-copy { margin:6px 0 0; font-size:12px; color:var(--muted); }
        .topic-row { display:flex; flex-wrap:wrap; gap:8px; }
        .stakeholder-list { display:flex; flex-direction:column; gap:10px; border-top:1px solid var(--line); padding-top:12px; }
        .stakeholder-row { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
        .stakeholder-meta { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
        .role-pill { border-radius:999px; padding:4px 8px; font-size:10px; font-weight:700; text-transform:uppercase; }
        .role-pill.decision_maker { background:#eff6ff; color:var(--blue); }
        .role-pill.champion { background:#f0fdf4; color:var(--green); }
        .role-pill.influencer { background:#fff7ed; color:var(--amber); }
        .role-pill.blocker { background:#fef2f2; color:#ef4444; }
        @media (max-width: 1100px) {
          .analytics-grid, .dashboard-grid { grid-template-columns:1fr !important; }
          .split-grid { grid-template-columns:1fr; }
        }
      `}</style>
    </motion.div>
  );
}

