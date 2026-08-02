"use client";

import React, { useState } from "react";
import { useCampaign } from "@/stores/campaign-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from "recharts";
import { 
  Building2, Users, Briefcase, Target, Search, ChevronDown, ChevronRight, 
  Globe, Linkedin, MessageSquare, CheckCircle2, TrendingUp, AlertCircle
} from "lucide-react";
import Link from "next/link";

export function ResearchCenter() {
  const { state } = useCampaign();
  const research = state.agentResults?.research;
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (!research) {
    return (
      <div className="empty-state">
        <Search size={48} className="empty-icon" />
        <h3 className="empty-title">No Research Data</h3>
        <p className="empty-subtitle">
          Run a campaign from the Agent Monitor to generate research intelligence.
        </p>
        <Link href="/agent-monitor">
          <button className="primary-button">Run Campaign</button>
        </Link>
        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            text-align: center;
          }
          .empty-icon { color: var(--muted); margin-bottom: 24px; opacity: 0.5; }
          .empty-title { font: 800 24px "Plus Jakarta Sans"; margin: 0 0 12px; }
          .empty-subtitle { color: var(--muted); margin: 0 0 24px; max-width: 400px; line-height: 1.5; }
        `}</style>
      </div>
    );
  }

  const companies = research.companies || [];
  
  // Aggregations
  const totalAnalyzed = companies.length;
  const avgConfidence = Math.round(companies.reduce((acc: number, c: any) => acc + c.research_scores.overall_confidence, 0) / (totalAnalyzed || 1));
  const totalOpenPositions = companies.reduce((acc: number, c: any) => acc + c.linkedin_analysis.open_positions, 0);
  const totalFindings = companies.reduce((acc: number, c: any) => acc + c.key_findings.length, 0);
  
  // Collect unique tech stack
  const techStack = Array.from(new Set(
    companies.flatMap((c: any) => c.website_analysis.technology_stack)
  ));

  // Collect key findings with evidence
  const allFindings = companies.flatMap((c: any) => 
    c.evidence.map((e: any) => ({ company: c.company_profile.company_name, ...e }))
  ).slice(0, 8); // Top 8

  const toggleRow = (idx: number) => {
    setExpandedRow(expandedRow === idx ? null : idx);
  };

  const getScoreColor = (score: number) => {
    if (score < 70) return "#dc2626"; // red
    if (score < 85) return "#d97706"; // amber
    return "#16a34a"; // green
  };

  // Chart data
  const scoreData = companies.map((c: any) => ({
    name: c.company_profile.company_name,
    Website: c.research_scores.website_score,
    LinkedIn: c.research_scores.linkedin_score,
    Reddit: c.research_scores.reddit_score,
  }));

  const sentimentData = companies.map((c: any) => ({
    name: c.company_profile.company_name,
    Positive: c.reddit_analysis.positive,
    Neutral: c.reddit_analysis.neutral,
    Negative: c.reddit_analysis.negative,
  }));

  const hiringData = companies.map((c: any) => ({
    name: c.company_profile.company_name,
    Cloud: c.linkedin_analysis.cloud_jobs,
    Azure: c.linkedin_analysis.azure_jobs,
    AWS: c.linkedin_analysis.aws_jobs,
    AI: c.linkedin_analysis.ai_jobs,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="research-container">
      <header className="header-row">
        <div>
          <div className="eyebrow">ACCOUNT INTELLIGENCE</div>
          <h1 className="page-title">Research Center</h1>
          <p className="subtle">Deep-dive analysis across target accounts for {research.product}</p>
        </div>
      </header>

      {/* KPI Row */}
      <div className="metrics">
        <div className="card">
          <div className="metric-label">Companies Analyzed <Building2 size={15} /></div>
          <div className="metric-number">{totalAnalyzed}</div>
          <div className="trend">Successfully profiled</div>
        </div>
        <div className="card">
          <div className="metric-label">Avg Confidence <Target size={15} /></div>
          <div className="metric-number">{avgConfidence}%</div>
          <div className="trend" style={{ color: getScoreColor(avgConfidence) }}>Data accuracy score</div>
        </div>
        <div className="card">
          <div className="metric-label">Total Open Positions <Users size={15} /></div>
          <div className="metric-number">{totalOpenPositions.toLocaleString()}</div>
          <div className="trend">Across target accounts</div>
        </div>
        <div className="card">
          <div className="metric-label">Key Intelligence <Briefcase size={15} /></div>
          <div className="metric-number">{totalFindings}</div>
          <div className="trend">Actionable findings</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="stack">
          {/* Companies Table */}
          <div className="card full-width">
            <h3 className="card-title">Target Accounts</h3>
            <p className="card-subtitle">Comprehensive intelligence breakdown per company</p>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Industry</th>
                    <th>HQ</th>
                    <th>Employees</th>
                    <th>Web</th>
                    <th>Social</th>
                    <th>Sentiment</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c: any, idx: number) => {
                    const isExpanded = expandedRow === idx;
                    return (
                      <React.Fragment key={idx}>
                        <tr onClick={() => toggleRow(idx)} className={isExpanded ? "expanded" : ""}>
                          <td className="company-name-cell">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <div className="company-icon">{c.company_profile.company_name.substring(0,2).toUpperCase()}</div>
                            <strong>{c.company_profile.company_name}</strong>
                          </td>
                          <td>{c.company_profile.industry}</td>
                          <td>{c.company_profile.headquarters}</td>
                          <td>{(c.company_profile.employees / 1000).toFixed(1)}k</td>
                          <td><ScoreBadge score={c.research_scores.website_score} /></td>
                          <td><ScoreBadge score={c.research_scores.linkedin_score} /></td>
                          <td><ScoreBadge score={c.research_scores.reddit_score} /></td>
                          <td><ScoreBadge score={c.research_scores.overall_confidence} bold /></td>
                        </tr>
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="detail-cell">
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: "auto", opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }}
                                  className="detail-panel"
                                >
                                  <div className="detail-grid">
                                    <div className="detail-section">
                                      <h4><Globe size={14}/> Website Insights</h4>
                                      <ul>
                                        {c.website_analysis.recent_announcements.map((a: string, i: number) => (
                                          <li key={i}>{a}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="detail-section">
                                      <h4><Linkedin size={14}/> LinkedIn Insights</h4>
                                      <p>Growth: {c.linkedin_analysis.employee_growth}% | Open: {c.linkedin_analysis.open_positions}</p>
                                      <ul>
                                        {c.linkedin_analysis.top_hiring_roles.slice(0, 3).map((r: string, i: number) => (
                                          <li key={i}>{r}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="detail-section">
                                      <h4><MessageSquare size={14}/> Community Sentiment</h4>
                                      <p className="sentiment-tag" data-sentiment={c.reddit_analysis.overall_sentiment.toLowerCase()}>
                                        {c.reddit_analysis.overall_sentiment}
                                      </p>
                                      <ul>
                                        {c.reddit_analysis.top_discussions.slice(0, 3).map((d: string, i: number) => (
                                          <li key={i}>{d}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-grid">
            <div className="card">
              <h3 className="card-title">Research Confidence Scores</h3>
              <p className="card-subtitle">Data quality by source</p>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scoreData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Website" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="LinkedIn" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Reddit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Community Sentiment (Reddit)</h3>
              <p className="card-subtitle">Discussion polarity</p>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sentimentData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Positive" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Neutral" stackId="a" fill="#94a3b8" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="stack">
          {/* Key Findings with Evidence */}
          <div className="card">
            <h3 className="card-title">Actionable Intelligence</h3>
            <p className="card-subtitle">Verified findings across accounts</p>
            <div className="findings-list">
              {allFindings.map((finding: any, idx: number) => (
                <div className="finding-item" key={idx}>
                  <div className="finding-icon"><AlertCircle size={14} /></div>
                  <div className="finding-content">
                    <div className="finding-meta">
                      <strong>{finding.company}</strong>
                      <span className="source-badge">{finding.source}</span>
                    </div>
                    <p>{finding.fact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Stack Grid */}
          <div className="card">
            <h3 className="card-title">Detected Technology Stack</h3>
            <p className="card-subtitle">Technologies mentioned across platforms</p>
            <div className="tech-grid">
              {techStack.map((tech: any, idx: number) => (
                <div className="tech-pill" key={idx}>{tech}</div>
              ))}
            </div>
          </div>

          {/* Hiring Trends */}
          <div className="card">
            <h3 className="card-title">Target Role Hiring Trends</h3>
            <p className="card-subtitle">Open positions in strategic categories</p>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hiringData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Cloud" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Azure" fill="#2563eb" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="AWS" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="AI" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .research-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media(max-width: 1024px) {
          .charts-grid { grid-template-columns: 1fr; }
        }

        /* Table Styles */
        .table-container {
          margin-top: 16px;
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .data-table th {
          text-align: left;
          padding: 12px;
          color: var(--muted);
          font-weight: 600;
          border-bottom: 1px solid var(--line);
          white-space: nowrap;
        }
        .data-table td {
          padding: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .data-table tr:hover:not(.detail-row) td {
          background: #f8fafc;
          cursor: pointer;
        }
        .data-table tr.expanded td {
          background: #f8fafc;
          border-bottom: none;
        }
        .company-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--navy);
        }
        .score-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 11px;
        }
        
        /* Details Panel */
        .detail-cell {
          padding: 0 !important;
          border-bottom: 1px solid var(--line) !important;
        }
        .detail-panel {
          background: #f8fafc;
          padding: 0 24px 24px 44px;
          overflow: hidden;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--line);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .detail-section h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          font-size: 13px;
          color: var(--navy);
        }
        .detail-section ul {
          margin: 0;
          padding-left: 20px;
          font-size: 12px;
          color: var(--muted);
          display: grid;
          gap: 6px;
        }
        .detail-section p {
          font-size: 12px;
          color: var(--muted);
          margin: 0 0 10px;
        }

        /* Findings List */
        .findings-list {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }
        .finding-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .finding-icon {
          color: var(--blue);
          margin-top: 2px;
        }
        .finding-content p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #334155;
          line-height: 1.4;
        }
        .finding-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
        }
        .source-badge {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          background: #e2e8f0;
          color: #475569;
          border-radius: 4px;
          font-weight: 700;
        }

        /* Tech Grid */
        .tech-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }
        .tech-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 20px;
          border: 1px solid #bfdbfe;
        }

        /* Sentiment Tags */
        .sentiment-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .sentiment-tag[data-sentiment="positive"] { background: #dcfce7; color: #166534; }
        .sentiment-tag[data-sentiment="neutral"] { background: #f1f5f9; color: #475569; }
        .sentiment-tag[data-sentiment="negative"] { background: #fee2e2; color: #991b1b; }

        .chart-wrapper {
          margin-top: 20px;
        }
      `}</style>
    </motion.div>
  );
}

function ScoreBadge({ score, bold = false }: { score: number, bold?: boolean }) {
  let bg = "#fef2f2"; let color = "#ef4444";
  if (score >= 85) { bg = "#f0fdf4"; color = "#16a34a"; }
  else if (score >= 70) { bg = "#fff7ed"; color = "#ea580c"; }
  
  return (
    <span className="score-badge" style={{ backgroundColor: bg, color, fontWeight: bold ? 800 : 600 }}>
      {score}
    </span>
  );
}
