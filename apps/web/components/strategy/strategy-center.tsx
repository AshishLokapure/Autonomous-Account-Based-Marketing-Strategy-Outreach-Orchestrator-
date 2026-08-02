"use client";

import React, { useState } from "react";
import { useCampaign } from "@/stores/campaign-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip 
} from "recharts";
import { 
  Building2, ChevronDown, ChevronUp, Target, 
  Lightbulb, Activity, Clock, ListChecks, Link as LinkIcon
} from "lucide-react";
import Link from "next/link";

const COLORS = {
  P1: "var(--green)",
  P2: "var(--amber)",
  P3: "var(--navy)"
};

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
      <div className="empty-state text-center py-20 flex flex-col items-center justify-center">
        <Target size={48} className="text-muted mb-4 mx-auto" />
        <h3 className="text-xl font-bold mb-2">No Strategy Data</h3>
        <p className="text-muted mb-6">Run a campaign to generate account intelligence and strategies.</p>
        <Link href="/">
          <button className="primary-button bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">Run Campaign</button>
        </Link>
      </div>
    );
  }

  const chartData = [
    { name: "P1 Accounts", value: data.totals?.p1_accounts || 0, color: COLORS.P1 },
    { name: "P2 Accounts", value: data.totals?.p2_accounts || 0, color: COLORS.P2 },
    { name: "P3 Accounts", value: data.totals?.p3_accounts || 0, color: COLORS.P3 },
  ].filter(d => d.value > 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="strategy-container p-6"
    >
      <header className="page-header mb-8">
        <p className="eyebrow text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">EXECUTION</p>
        <h1 className="page-title text-3xl font-extrabold text-slate-900 font-jakarta">Strategy Center</h1>
      </header>

      <div className="kpi-grid mb-8">
        <div className="card metric-card">
          <p className="metric-label">P1 Accounts</p>
          <p className="metric-number text-green">{data.totals?.p1_accounts || 0}</p>
        </div>
        <div className="card metric-card">
          <p className="metric-label">P2 Accounts</p>
          <p className="metric-number text-amber">{data.totals?.p2_accounts || 0}</p>
        </div>
        <div className="card metric-card">
          <p className="metric-label">P3 Accounts</p>
          <p className="metric-number text-navy">{data.totals?.p3_accounts || 0}</p>
        </div>
        <div className="card metric-card">
          <p className="metric-label">Avg Priority Score</p>
          <p className="metric-number">{data.totals?.avg_priority_score || 0}</p>
        </div>
      </div>

      <div className="chart-section mb-10">
        <div className="card bg-white border border-slate-200 rounded-[15px] p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold mb-4 text-lg">Priority Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="strategies-list">
        <h2 className="text-xl font-bold mb-4 font-jakarta">Account Strategies</h2>
        {data.companies?.map((company: any, idx: number) => (
          <div key={idx} className="card strategy-card mb-4 bg-white border border-slate-200 rounded-[15px] p-5 shadow-sm hover:shadow-md transition-shadow">
            <div 
              className="strategy-header flex justify-between items-center cursor-pointer"
              onClick={() => toggleCard(company.company_name)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-50 rounded-lg text-blue-600">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{company.company_name}</h3>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className={`badge tier-${company.priority_tier?.toLowerCase()}`}>
                      {company.priority_tier}
                    </span>
                    <span className="text-slate-500 font-medium">Score: {company.priority_score}</span>
                  </div>
                </div>
              </div>
              <button className="icon-btn text-slate-400 hover:text-slate-900 transition-colors p-2">
                {expandedCards[company.company_name] ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
            
            <AnimatePresence>
              {expandedCards[company.company_name] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="strategy-content pt-6 mt-4 border-t border-slate-100">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="font-bold flex items-center gap-2 mb-2 text-sm text-slate-600">
                          <Target size={16} className="text-blue-600" /> Account Strategy
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{company.account_strategy}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="font-bold flex items-center gap-2 mb-2 text-sm text-slate-600">
                          <Lightbulb size={16} className="text-amber-500" /> Recommended Pitch
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{company.recommended_pitch}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-bold flex items-center gap-2 mb-3 text-sm text-slate-600">
                        <Activity size={16} className="text-teal-500" /> Whitespace Opportunities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {company.whitespace_opportunities?.map((opp: string, i: number) => (
                          <span key={i} className="pill text-xs bg-white text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm font-medium">
                            {opp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-bold flex items-center gap-2 mb-2 text-sm text-slate-600">
                          <Clock size={16} className="text-slate-400" /> Timeline
                        </h4>
                        <p className="text-sm text-slate-700">{company.timeline}</p>
                      </div>
                      <div>
                        <h4 className="font-bold flex items-center gap-2 mb-2 text-sm text-slate-600">
                          <ListChecks size={16} className="text-green-600" /> Next Actions
                        </h4>
                        <ul className="text-sm text-slate-700 space-y-1.5">
                          {company.next_actions?.map((action: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {company.evidence && company.evidence.length > 0 && (
                      <div className="evidence-section bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="font-bold flex items-center gap-2 mb-3 text-sm text-slate-700">
                          <LinkIcon size={16} className="text-slate-400" /> Evidence & Sources
                        </h4>
                        <div className="space-y-2">
                          {company.evidence.map((ev: any, i: number) => (
                            <div key={i} className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 flex gap-2">
                              <span className="font-bold text-blue-600 shrink-0">{ev.source}:</span>
                              <span className="text-slate-600">{ev.fact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        .metric-card {
          padding: 1.5rem;
          background: white;
          border: 1px solid var(--line, #e7eaf0);
          border-radius: 15px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .metric-label {
          font-size: 0.875rem;
          color: var(--muted, #64748b);
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .metric-number {
          font-size: 2rem;
          font-weight: 800;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .text-green { color: var(--green, #16a34a); }
        .text-amber { color: var(--amber, #d97706); }
        .text-navy { color: var(--navy, #0f172a); }
        .text-blue { color: var(--blue, #2563eb); }
        
        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .tier-p1 { background: rgba(22, 163, 74, 0.1); color: var(--green, #16a34a); border: 1px solid rgba(22, 163, 74, 0.2); }
        .tier-p2 { background: rgba(217, 119, 6, 0.1); color: var(--amber, #d97706); border: 1px solid rgba(217, 119, 6, 0.2); }
        .tier-p3 { background: rgba(15, 23, 42, 0.1); color: var(--navy, #0f172a); border: 1px solid rgba(15, 23, 42, 0.2); }
      `}</style>
    </motion.div>
  );
}
