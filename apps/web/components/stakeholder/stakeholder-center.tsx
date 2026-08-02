"use client";

import { useCampaign } from "@/stores/campaign-store";
import { Users, UserCheck, ShieldAlert, Star, Shield, UsersRound, Mail, Presentation, Link as LinkIcon, Building2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = {
  decision_maker: "var(--blue)",
  champion: "var(--green)",
  influencer: "var(--amber)",
  blocker: "var(--red, #ef4444)"
};

export function StakeholderCenter() {
  const { state } = useCampaign() as any;
  const data = state.agentResults?.stakeholder as any;
  const [selectedCompany, setSelectedCompany] = useState<string>("All");

  if (!data) {
    return (
      <div className="empty-state">
        <UsersRound size={48} className="empty-icon" />
        <h3>No stakeholder data yet</h3>
        <p>Run a campaign to generate Stakeholder intelligence</p>
        <Link href="/agent-monitor">
          <button className="primary-button">Run Campaign</button>
        </Link>
        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
          }
          .empty-icon {
            color: var(--muted);
            margin-bottom: 20px;
          }
          h3 {
            font-family: "Plus Jakarta Sans";
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 10px;
          }
          p {
            color: var(--muted);
            margin: 0 0 24px;
          }
        `}</style>
      </div>
    );
  }

  const { totals, companies } = data;

  const displayCompanies = selectedCompany === "All" 
    ? companies 
    : companies.filter((c: any) => c.company_name === selectedCompany);

  const allStakeholders = displayCompanies.flatMap((c: any) => 
    c.stakeholders.map((s: any) => ({ ...s, company_name: c.company_name }))
  );

  const pieData = [
    { name: "Decision Makers", value: totals.decision_makers, fill: COLORS.decision_maker },
    { name: "Champions", value: totals.champions, fill: COLORS.champion },
    { name: "Influencers", value: totals.influencers, fill: COLORS.influencer },
    { name: "Blockers", value: totals.blockers, fill: COLORS.blocker },
  ].filter(d => d.value > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stk-container">
      <div className="header-row">
        <div>
          <div className="eyebrow">ACCOUNT INTELLIGENCE</div>
          <h1 className="page-title">Stakeholder Mapping</h1>
          <p className="subtle">Buying committee analysis for {data.product}</p>
        </div>
      </div>

      <div className="metrics">
        <div className="card">
          <div className="metric-label">Total Stakeholders <Users size={16} /></div>
          <div className="metric-number">{totals.stakeholders_mapped}</div>
        </div>
        <div className="card">
          <div className="metric-label">Decision Makers <UserCheck size={16} /></div>
          <div className="metric-number" style={{color: COLORS.decision_maker}}>{totals.decision_makers}</div>
        </div>
        <div className="card">
          <div className="metric-label">Champions <Star size={16} /></div>
          <div className="metric-number" style={{color: COLORS.champion}}>{totals.champions}</div>
        </div>
        <div className="card">
          <div className="metric-label">Influencers <Shield size={16} /></div>
          <div className="metric-number" style={{color: COLORS.influencer}}>{totals.influencers}</div>
        </div>
        <div className="card">
          <div className="metric-label">Blockers <ShieldAlert size={16} /></div>
          <div className="metric-number" style={{color: COLORS.blocker}}>{totals.blockers}</div>
        </div>
      </div>

      <div className="filters">
        <button 
          className={`filter-btn ${selectedCompany === "All" ? "active" : ""}`}
          onClick={() => setSelectedCompany("All")}
        >
          All Accounts
        </button>
        {companies.map((c: any) => (
          <button 
            key={c.company_name}
            className={`filter-btn ${selectedCompany === c.company_name ? "active" : ""}`}
            onClick={() => setSelectedCompany(c.company_name)}
          >
            {c.company_name}
          </button>
        ))}
      </div>

      <div className="dashboard-grid custom-grid">
        <div className="stack">
          <h2 className="section-title">Key Stakeholders</h2>
          <div className="stakeholder-grid">
            <AnimatePresence>
              {allStakeholders.map((s: any, idx: number) => (
                <motion.div 
                  key={`${s.company_name}-${s.name}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card stk-card"
                >
                  <div className="stk-header">
                    <div>
                      <h3 className="stk-name">{s.name}</h3>
                      <div className="stk-title">{s.title}</div>
                      <div className="stk-company"><Building2 size={12}/> {s.company_name}</div>
                    </div>
                    <div className={`stk-badge ${s.type}`}>{s.type.replace('_', ' ')}</div>
                  </div>
                  <div className="stk-stats">
                    <div className="stk-stat">
                      <span>Influence</span>
                      <strong>{s.influence}</strong>
                    </div>
                    <div className="stk-stat">
                      <span>Relationship</span>
                      <strong>{s.relationship}</strong>
                    </div>
                  </div>
                  <div className="stk-footer">
                    <LinkIcon size={12} /> {s.recent_engagement}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="stack">
          <div className="card">
            <h3 className="card-title">Buying Committee Breakdown</h3>
            <p className="card-subtitle">Distribution across active accounts</p>
            <div style={{ height: 260, marginTop: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="stack" style={{ marginTop: '20px' }}>
        <h2 className="section-title">Analytics & Evidence</h2>
        <div className="analytics-grid">
          {displayCompanies.map((c: any) => (
            <div key={`analytics-${c.company_name}`} className="card">
              <h3 className="card-title">{c.company_name}</h3>
              <div className="analytics-split">
                <div>
                  <div className="metric-label">Meetings <Presentation size={14}/></div>
                  <div className="analytics-val">{c.meeting_analytics.meetings_held} <small>avg sentiment: {c.meeting_analytics.avg_sentiment}</small></div>
                  <div className="topics">
                    {c.meeting_analytics.key_topics.map((t: string) => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
                <div>
                  <div className="metric-label">Emails <Mail size={14}/></div>
                  <div className="analytics-val">{c.email_analytics.threads_analyzed} <small>reply rate: {c.email_analytics.reply_rate}</small></div>
                  <div className="last-contact">Last contact: {c.email_analytics.last_contact}</div>
                </div>
              </div>
              <div className="evidence-list">
                {c.evidence.map((e: any, i: number) => (
                  <div key={i} className="evidence-item">
                    <strong>{e.source}</strong>: {e.fact}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .custom-grid {
          grid-template-columns: 2fr 1fr;
          align-items: start;
        }
        .section-title {
          font: 700 18px "Plus Jakarta Sans";
          margin: 0 0 16px;
        }
        .filters {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .filter-btn {
          background: #fff;
          border: 1px solid var(--line);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-btn:hover {
          border-color: var(--blue);
          color: var(--navy);
        }
        .filter-btn.active {
          background: var(--blue);
          color: #fff;
          border-color: var(--blue);
        }
        
        .stakeholder-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 1400px) {
          .stakeholder-grid { grid-template-columns: 1fr; }
          .custom-grid { grid-template-columns: 1fr; }
        }
        
        .stk-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .stk-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .stk-name {
          font: 700 16px "Plus Jakarta Sans";
          margin: 0 0 4px;
        }
        .stk-title {
          font-size: 13px;
          color: var(--navy);
          margin-bottom: 6px;
        }
        .stk-company {
          font-size: 11px;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .stk-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          background: var(--canvas);
        }
        .stk-badge.decision_maker { background: #eff6ff; color: var(--blue); }
        .stk-badge.champion { background: #f0fdf4; color: var(--green); }
        .stk-badge.influencer { background: #fff7ed; color: var(--amber); }
        .stk-badge.blocker { background: #fef2f2; color: #ef4444; }
        
        .stk-stats {
          display: flex;
          gap: 20px;
          padding: 12px 0;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .stk-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stk-stat span { font-size: 11px; color: var(--muted); }
        .stk-stat strong { font-size: 13px; font-weight: 700; }
        
        .stk-footer {
          font-size: 12px;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 1100px) {
          .analytics-grid { grid-template-columns: 1fr; }
        }
        
        .analytics-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line);
        }
        .analytics-val {
          font: 800 20px "Plus Jakarta Sans";
          margin: 8px 0;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .analytics-val small {
          font: 500 12px "DM Sans";
          color: var(--muted);
        }
        .topics {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }
        .last-contact {
          font-size: 12px;
          color: var(--muted);
          margin-top: 10px;
        }
        .evidence-list {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .evidence-item {
          font-size: 12px;
          color: var(--navy);
          background: var(--canvas);
          padding: 8px 12px;
          border-radius: 8px;
        }
        .evidence-item strong {
          color: var(--blue);
        }
      `}</style>
    </motion.div>
  );
}
