"use client";

import React, { useState } from "react";
import { useCampaign } from "@/stores/campaign-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip 
} from "recharts";
import { 
  Building2, ChevronDown, ChevronUp, Target, 
  Lightbulb, Activity, Clock, ListChecks, Link as LinkIcon,
  Shield, TrendingUp, Zap, Hash
} from "lucide-react";
import Link from "next/link";

/* ── Helpers ─────────────────────────────────────────── */

const TIER_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string; label: string }> = {
  P1: { color: "#16a34a", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.2)", glow: "rgba(22,163,74,0.12)", label: "High Priority" },
  P2: { color: "#d97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.2)", glow: "rgba(217,119,6,0.12)", label: "Medium Priority" },
  P3: { color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)", glow: "rgba(99,102,241,0.12)", label: "Monitor" },
};

const AVATAR_COLORS = [
  "#4B73FF", "#8069FF", "#FF72BA", "#1E9B65", "#D78427",
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6",
];

function getInitials(name: string): string {
  return name.split(/[\s&]+/).filter(Boolean).map(w => w[0]).join("").substring(0, 2).toUpperCase();
}

function ScoreRing({ score, size = 48, stroke = 4 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const color = score >= 85 ? "#16a34a" : score >= 75 ? "#d97706" : "#6366f1";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: size * 0.3, fontWeight: 800, fill: "#0f172a", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {score}
      </text>
    </svg>
  );
}

/* ── Main Component ──────────────────────────────────── */

export function StrategyCenter() {
  const { state } = useCampaign();
  const data = state.agentResults?.strategy as any;
  
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (companyName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
  };

  if (!data) {
    return (
      <div className="sc-empty">
        <div className="sc-empty-icon"><Target size={40} /></div>
        <h3>No Strategy Data</h3>
        <p>Run a campaign to generate account intelligence and strategies.</p>
        <Link href="/">
          <button className="sc-cta-btn">Run Campaign</button>
        </Link>
      </div>
    );
  }

  const chartData = [
    { name: "P1 — High Priority", value: data.totals?.p1_accounts || 0, color: "#16a34a" },
    { name: "P2 — Medium Priority", value: data.totals?.p2_accounts || 0, color: "#d97706" },
    { name: "P3 — Monitor", value: data.totals?.p3_accounts || 0, color: "#6366f1" },
  ].filter(d => d.value > 0);

  const totalAccounts = (data.totals?.p1_accounts || 0) + (data.totals?.p2_accounts || 0) + (data.totals?.p3_accounts || 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sc-container"
    >
      <header className="sc-header">
        <p className="sc-eyebrow">EXECUTION</p>
        <h1 className="sc-title">Strategy Center</h1>
      </header>

      {/* ── KPI Cards ─────────────────────────────── */}
      <div className="sc-kpi-grid">
        <div className="sc-kpi" style={{ borderTop: "3px solid #16a34a" }}>
          <div className="sc-kpi-icon" style={{ background: TIER_CONFIG.P1.bg, color: TIER_CONFIG.P1.color }}>
            <Zap size={18} />
          </div>
          <div>
            <p className="sc-kpi-label">P1 Accounts</p>
            <p className="sc-kpi-value" style={{ color: "#16a34a" }}>{data.totals?.p1_accounts || 0}</p>
          </div>
        </div>
        <div className="sc-kpi" style={{ borderTop: "3px solid #d97706" }}>
          <div className="sc-kpi-icon" style={{ background: TIER_CONFIG.P2.bg, color: TIER_CONFIG.P2.color }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="sc-kpi-label">P2 Accounts</p>
            <p className="sc-kpi-value" style={{ color: "#d97706" }}>{data.totals?.p2_accounts || 0}</p>
          </div>
        </div>
        <div className="sc-kpi" style={{ borderTop: "3px solid #6366f1" }}>
          <div className="sc-kpi-icon" style={{ background: TIER_CONFIG.P3.bg, color: TIER_CONFIG.P3.color }}>
            <Shield size={18} />
          </div>
          <div>
            <p className="sc-kpi-label">P3 Accounts</p>
            <p className="sc-kpi-value" style={{ color: "#6366f1" }}>{data.totals?.p3_accounts || 0}</p>
          </div>
        </div>
        <div className="sc-kpi" style={{ borderTop: "3px solid #2563eb" }}>
          <div className="sc-kpi-icon" style={{ background: "rgba(37,99,235,0.08)", color: "#2563eb" }}>
            <Hash size={18} />
          </div>
          <div>
            <p className="sc-kpi-label">Avg Priority Score</p>
            <p className="sc-kpi-value" style={{ color: "#2563eb" }}>{data.totals?.avg_priority_score || 0}</p>
          </div>
        </div>
      </div>

      {/* ── Chart + Legend Row ─────────────────────── */}
      <div className="sc-chart-row">
        <div className="sc-chart-card">
          <h3 className="sc-section-title">Priority Distribution</h3>
          <div className="sc-chart-body">
            <div className="sc-chart-donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      padding: "8px 14px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="sc-chart-center">
                <span className="sc-chart-center-num">{totalAccounts}</span>
                <span className="sc-chart-center-label">Total</span>
              </div>
            </div>
            <div className="sc-chart-legend">
              {chartData.map((item, i) => (
                <div key={i} className="sc-legend-item">
                  <span className="sc-legend-dot" style={{ background: item.color }} />
                  <span className="sc-legend-label">{item.name}</span>
                  <span className="sc-legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Strategy Cards ────────────────────────── */}
      <div className="sc-strategies">
        <h2 className="sc-section-title" style={{ marginBottom: 16 }}>Account Strategies</h2>
        {data.companies?.map((company: any, idx: number) => {
          const tier = TIER_CONFIG[company.priority_tier] || TIER_CONFIG.P3;
          const isOpen = expandedCards[company.company_name];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="sc-card"
              style={{ borderLeft: `3px solid ${tier.color}` }}
            >
              <div className="sc-card-header" onClick={() => toggleCard(company.company_name)}>
                <div className="sc-card-left">
                  <div className="sc-card-avatar" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                    {getInitials(company.company_name)}
                  </div>
                  <div className="sc-card-info">
                    <h3 className="sc-card-name">{company.company_name}</h3>
                    <div className="sc-card-meta">
                      <span className="sc-tier-badge" style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                        {company.priority_tier}
                      </span>
                      <span className="sc-card-channel">{company.channel_strategy}</span>
                      <span className="sc-card-timeline">
                        <Clock size={12} /> {company.timeline}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="sc-card-right">
                  <ScoreRing score={company.priority_score} />
                  <button className="sc-chevron-btn">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="sc-card-body">
                      {/* Strategy + Pitch */}
                      <div className="sc-two-col">
                        <div className="sc-info-box">
                          <h4 className="sc-info-title">
                            <Target size={15} style={{ color: "#2563eb" }} /> Account Strategy
                          </h4>
                          <p className="sc-info-text">{company.account_strategy}</p>
                        </div>
                        <div className="sc-info-box sc-info-box-amber">
                          <h4 className="sc-info-title">
                            <Lightbulb size={15} style={{ color: "#d97706" }} /> Recommended Pitch
                          </h4>
                          <p className="sc-info-text">{company.recommended_pitch}</p>
                        </div>
                      </div>

                      {/* Whitespace */}
                      <div className="sc-section">
                        <h4 className="sc-info-title">
                          <Activity size={15} style={{ color: "#14b8a6" }} /> Whitespace Opportunities
                        </h4>
                        <div className="sc-pills">
                          {company.whitespace_opportunities?.map((opp: string, i: number) => (
                            <span key={i} className="sc-pill">{opp}</span>
                          ))}
                        </div>
                      </div>

                      {/* Timeline + Next Actions */}
                      <div className="sc-two-col">
                        <div className="sc-section">
                          <h4 className="sc-info-title">
                            <Clock size={15} style={{ color: "#64748b" }} /> Timeline
                          </h4>
                          <div className="sc-timeline-badge">{company.timeline}</div>
                          {company.risks && company.risks.length > 0 && (
                            <div className="sc-risks">
                              <h4 className="sc-info-title" style={{ marginTop: 16 }}>
                                <Shield size={15} style={{ color: "#dc2626" }} /> Risks & Objections
                              </h4>
                              <ul className="sc-risk-list">
                                {company.risks.map((risk: string, i: number) => (
                                  <li key={i}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="sc-section">
                          <h4 className="sc-info-title">
                            <ListChecks size={15} style={{ color: "#16a34a" }} /> Next Actions
                          </h4>
                          <ul className="sc-actions-list">
                            {company.next_actions?.map((action: string, i: number) => (
                              <li key={i}>
                                <span className="sc-action-num">{i + 1}</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Evidence */}
                      {company.evidence && company.evidence.length > 0 && (
                        <div className="sc-evidence">
                          <h4 className="sc-info-title">
                            <LinkIcon size={15} style={{ color: "#64748b" }} /> Evidence & Sources
                          </h4>
                          <div className="sc-evidence-grid">
                            {company.evidence.map((ev: any, i: number) => (
                              <div key={i} className="sc-evidence-item">
                                <span className="sc-evidence-source">{ev.source}</span>
                                <span className="sc-evidence-fact">{ev.fact}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <style jsx global>{`
        /* ── Container ───────────────────────────────── */
        .sc-container { padding: 24px; }
        .sc-header { margin-bottom: 28px; }
        .sc-eyebrow {
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .sc-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── KPI Grid ────────────────────────────────── */
        .sc-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .sc-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .sc-kpi {
          display: flex;
          align-items: center;
          gap: 14px;
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 14px;
          padding: 18px 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .sc-kpi:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .sc-kpi-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .sc-kpi-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
        }
        .sc-kpi-value {
          font-size: 1.5rem;
          font-weight: 800;
          font-family: 'Plus Jakarta Sans', sans-serif;
          line-height: 1;
        }

        /* ── Chart Row ───────────────────────────────── */
        .sc-chart-row { margin-bottom: 28px; }
        .sc-chart-card {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .sc-section-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .sc-chart-body {
          display: flex;
          align-items: center;
          gap: 40px;
          margin-top: 16px;
        }
        .sc-chart-donut {
          position: relative;
          width: 200px;
          height: 200px;
          flex-shrink: 0;
        }
        .sc-chart-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .sc-chart-center-num {
          display: block;
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
          line-height: 1;
        }
        .sc-chart-center-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .sc-chart-legend {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .sc-legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8125rem;
        }
        .sc-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sc-legend-label {
          color: #64748b;
          font-weight: 500;
          flex: 1;
        }
        .sc-legend-value {
          font-weight: 800;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Strategy Cards ──────────────────────────── */
        .sc-strategies { margin-bottom: 24px; }
        .sc-card {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 14px;
          margin-bottom: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s;
          overflow: hidden;
        }
        .sc-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.07);
        }

        /* ── Card Header ─────────────────────────────── */
        .sc-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          cursor: pointer;
          gap: 16px;
        }
        .sc-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .sc-card-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: white;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }
        .sc-card-info {
          min-width: 0;
        }
        .sc-card-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 5px;
        }
        .sc-card-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sc-tier-badge {
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .sc-card-channel {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }
        .sc-card-timeline {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .sc-card-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .sc-chevron-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e7eaf0;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sc-chevron-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        /* ── Card Body ───────────────────────────────── */
        .sc-card-body {
          padding: 0 20px 20px 20px;
          border-top: 1px solid #f1f5f9;
          margin-top: 0;
          padding-top: 20px;
        }
        .sc-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 640px) {
          .sc-two-col { grid-template-columns: 1fr; }
        }
        .sc-section {
          margin-bottom: 16px;
        }
        .sc-info-box {
          background: #f8fafc;
          border: 1px solid #e7eaf0;
          border-radius: 12px;
          padding: 16px;
        }
        .sc-info-box-amber {
          background: #fffbeb;
          border-color: #fde68a;
        }
        .sc-info-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 10px;
        }
        .sc-info-text {
          font-size: 0.8125rem;
          color: #334155;
          line-height: 1.65;
          font-weight: 500;
        }

        /* ── Pills ───────────────────────────────────── */
        .sc-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sc-pill {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          background: white;
          color: #334155;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          transition: all 0.15s;
        }
        .sc-pill:hover {
          border-color: #93b4fd;
          color: #2563eb;
          background: #f0f4ff;
        }

        /* ── Timeline Badge ──────────────────────────── */
        .sc-timeline-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0f172a;
        }

        /* ── Risks ───────────────────────────────────── */
        .sc-risk-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sc-risk-list li {
          font-size: 0.8125rem;
          color: #dc2626;
          font-weight: 500;
          padding: 4px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sc-risk-list li::before {
          content: "⚠";
          font-size: 0.75rem;
        }

        /* ── Actions List ────────────────────────────── */
        .sc-actions-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sc-actions-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.8125rem;
          color: #334155;
          font-weight: 500;
          line-height: 1.5;
        }
        .sc-action-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #dbeafe;
          color: #2563eb;
          font-size: 0.6875rem;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* ── Evidence ────────────────────────────────── */
        .sc-evidence {
          background: #f8fafc;
          border: 1px solid #e7eaf0;
          border-radius: 12px;
          padding: 16px;
        }
        .sc-evidence-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        @media (max-width: 640px) {
          .sc-evidence-grid { grid-template-columns: 1fr; }
        }
        .sc-evidence-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.75rem;
        }
        .sc-evidence-source {
          display: block;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 4px;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .sc-evidence-fact {
          color: #475569;
          line-height: 1.5;
        }

        /* ── Empty State ─────────────────────────────── */
        .sc-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }
        .sc-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          margin-bottom: 20px;
        }
        .sc-empty h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .sc-empty p {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 24px;
        }
        .sc-cta-btn {
          padding: 10px 24px;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .sc-cta-btn:hover {
          background: #1d4ed8;
        }
      `}</style>
    </motion.div>
  );
}
