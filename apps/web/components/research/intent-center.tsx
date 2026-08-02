"use client";

import { useCampaign } from "@/stores/campaign-store";
import { Activity, Target, Zap, Clock, ShieldAlert, Building2, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const URGENCY_COLORS = {
  High: "var(--green)",
  Medium: "var(--amber)",
  Low: "var(--red, #ef4444)",
};

export function IntentCenter() {
  const { state } = useCampaign() as any;
  const data = state.agentResults?.intent as any;

  if (!data) {
    return (
      <div className="empty-state">
        <Activity size={48} className="empty-icon" />
        <h3>No intent signals detected</h3>
        <p>Run a campaign to generate Intent intelligence</p>
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

  const allSignals = companies.flatMap((c: any) => 
    c.buying_signals.map((s: any) => ({ ...s, company_name: c.company_name }))
  );
  
  const allCompetitors = companies.flatMap((c: any) => 
    c.competitor_mentions.map((comp: any) => ({ ...comp, company_name: c.company_name }))
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="intent-container">
      <div className="header-row">
        <div>
          <div className="eyebrow">ACCOUNT INTELLIGENCE</div>
          <h1 className="page-title">Intent Signals</h1>
          <p className="subtle">Buying intent and urgency for {data.product}</p>
        </div>
      </div>

      <div className="metrics intent-metrics">
        <div className="card">
          <div className="metric-label">Avg Intent Score <Target size={16} /></div>
          <div className="metric-number" style={{ color: totals.average_intent_score >= 70 ? 'var(--green)' : 'var(--amber)' }}>
            {totals.average_intent_score}
          </div>
        </div>
        <div className="card">
          <div className="metric-label">High Intent Accounts <TrendingUp size={16} /></div>
          <div className="metric-number" style={{ color: 'var(--blue)' }}>{totals.high_intent_accounts}</div>
        </div>
        <div className="card">
          <div className="metric-label">Buying Signals Detected <Zap size={16} /></div>
          <div className="metric-number">{totals.buying_signals_detected}</div>
        </div>
      </div>

      <div className="dashboard-grid custom-grid">
        <div className="stack">
          <div className="card">
            <h3 className="card-title">Intent Score by Account</h3>
            <p className="card-subtitle">Higher score indicates stronger propensity to buy</p>
            <div style={{ height: 300, marginTop: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companies} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="company_name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="intent_score" radius={[0, 4, 4, 0]}>
                    {companies.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={URGENCY_COLORS[entry.urgency as keyof typeof URGENCY_COLORS] || 'var(--blue)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="stack">
          <div className="card">
            <h3 className="card-title">Urgency Timeline</h3>
            <p className="card-subtitle">Predicted engagement windows</p>
            <div className="timeline">
              {companies.map((c: any, i: number) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-header">
                    <span className="tl-company"><Building2 size={12}/> {c.company_name}</span>
                    <span className={`tl-badge ${c.urgency.toLowerCase()}`}>{c.urgency} Urgency</span>
                  </div>
                  <div className="tl-window"><Clock size={12}/> {c.predicted_timeline}</div>
                  {c.objections.length > 0 && (
                    <div className="tl-objections">
                      <AlertCircle size={12}/> {c.objections[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="stack" style={{ marginTop: '20px' }}>
        <h2 className="section-title">Detected Buying Signals</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="signals-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Signal</th>
                <th>Strength</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {allSignals.map((s: any, idx: number) => (
                <tr key={idx}>
                  <td><strong>{s.company_name}</strong></td>
                  <td>{s.signal}</td>
                  <td>
                    <span className={`strength-badge ${s.strength.toLowerCase()}`}>
                      {s.strength}
                    </span>
                  </td>
                  <td><span className="tag">{s.source}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="stack" style={{ marginTop: '20px' }}>
        <h2 className="section-title">Competitor Mentions</h2>
        <div className="competitor-grid">
          {allCompetitors.map((comp: any, idx: number) => (
            <div key={idx} className="card comp-card">
              <div className="comp-header">
                <ShieldAlert size={16} style={{ color: 'var(--amber)' }} />
                <strong>{comp.competitor}</strong>
              </div>
              <div className="comp-company">{comp.company_name}</div>
              <p className="comp-context">"{comp.context}"</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .custom-grid {
          grid-template-columns: 2fr 1.2fr;
          align-items: start;
        }
        .intent-metrics {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1000px) {
          .intent-metrics { grid-template-columns: 1fr; }
          .custom-grid { grid-template-columns: 1fr; }
        }
        
        .section-title {
          font: 700 18px "Plus Jakarta Sans";
          margin: 0 0 16px;
        }
        
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }
        .timeline-item {
          padding-left: 16px;
          border-left: 2px solid var(--line);
          position: relative;
        }
        .timeline-item::before {
          content: "";
          position: absolute;
          left: -5px;
          top: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--blue);
        }
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .tl-company {
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tl-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 12px;
          text-transform: uppercase;
        }
        .tl-badge.high { background: #f0fdf4; color: var(--green); }
        .tl-badge.medium { background: #fff7ed; color: var(--amber); }
        .tl-badge.low { background: #fef2f2; color: #ef4444; }
        
        .tl-window {
          font-size: 12px;
          color: var(--navy);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .tl-objections {
          font-size: 11px;
          color: var(--amber);
          background: #fff7ed;
          padding: 6px 10px;
          border-radius: 6px;
          display: flex;
          align-items: flex-start;
          gap: 6px;
          line-height: 1.4;
        }
        
        .signals-table {
          width: 100%;
          border-collapse: collapse;
        }
        .signals-table th {
          text-align: left;
          padding: 14px 16px;
          background: #f8fafc;
          font-size: 11px;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--line);
        }
        .signals-table td {
          padding: 14px 16px;
          font-size: 13px;
          border-bottom: 1px solid var(--line);
          color: var(--navy);
        }
        .signals-table tr:last-child td {
          border-bottom: none;
        }
        
        .strength-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .strength-badge.high { background: #f0fdf4; color: var(--green); }
        .strength-badge.medium { background: #fff7ed; color: var(--amber); }
        .strength-badge.low { background: #fef2f2; color: #ef4444; }
        
        .competitor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .comp-card {
          border-left: 3px solid var(--amber);
        }
        .comp-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .comp-company {
          font-size: 11px;
          color: var(--muted);
          margin-bottom: 10px;
        }
        .comp-context {
          font-size: 13px;
          line-height: 1.5;
          color: var(--navy);
          font-style: italic;
          margin: 0;
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
        }
      `}</style>
    </motion.div>
  );
}
