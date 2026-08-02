"use client";

import React from "react";
import {
  ArrowUpRight, Bot, CalendarDays, ChevronRight, CircleDollarSign,
  Lightbulb, Plus, TrendingUp, UsersRound, Zap, Sparkles, Rocket,
  Building2, ArrowRight, CheckCircle2, ShieldCheck, Mail, Target
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useCampaign } from "@/stores/campaign-store";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type LiveAccount = {
  name: string;
  industry: string;
  pipeline: string;
  stage: string;
  score: number;
  tier: string;
  highlight: string;
};
export function Dashboard() {
  const { state } = useCampaign();
  const { profile } = useAuth();

  const userName = profile?.full_name?.split(" ")[0] || "John";
  const isRunning = state.status === "running" || state.status === "starting";
  const isCompleted = state.status === "completed";

  // Live data extraction from Agent Results
  const agentResults = state.agentResults as Record<string, any> | null;
  const researchData = agentResults?.research;
  const stakeholderData = agentResults?.stakeholder;
  const intentData = agentResults?.intent;
  const strategyData = agentResults?.strategy;
  const outreachData = agentResults?.outreach;

  // Dynamic KPI Metrics
  const highIntentCount = intentData?.totals?.high_intent_accounts ?? 24;
  const targetAccountsCount = researchData?.companies_analyzed ?? 126;
  const stakeholdersCount = stakeholderData?.totals?.stakeholders_mapped ?? 84;
  const avgIntentScore = intentData?.totals?.average_intent_score ?? 74;
  const outreachAssetsCount = outreachData?.totals?.total_assets ?? 18;

  // Real accounts from agent data or rich defaults
  const liveAccounts = React.useMemo<LiveAccount[]>(() => {
    if (researchData?.companies && researchData.companies.length > 0) {
      return researchData.companies.map((c: any) => {
        const companyName = c.company_profile?.company_name || "Enterprise Account";
        const industry = c.company_profile?.industry || "Technology";
        const strat = strategyData?.companies?.find((s: any) => s.company_name === companyName);
        const int = intentData?.companies?.find((i: any) => i.company_name === companyName);
        
        const priorityTier = strat?.priority_tier || "P1";
        const score = int?.intent_score || c.research_scores?.overall_confidence || 88;
        const stage = priorityTier === "P1" ? "Proposal" : priorityTier === "P2" ? "Discovery" : "Targeted";
        const pipelineVal = `$${Math.round((score * 7.5))}K`;

        return {
          name: companyName,
          industry,
          pipeline: pipelineVal,
          stage,
          score,
          tier: priorityTier,
          highlight: strat?.account_strategy || c.key_findings?.[0] || "Active engagement sequence"
        };
      });
    }

    return [
      { name: "Novartis", industry: "Healthcare", pipeline: "$620K", stage: "Proposal", score: 92, tier: "P1", highlight: "AI infrastructure expansion identified through leadership updates" },
      { name: "Airtel Business", industry: "Telecom", pipeline: "$480K", stage: "Discovery", score: 87, tier: "P1", highlight: "Cloud modernization initiative with active executive engagement" },
      { name: "Lumen Technologies", industry: "Technology", pipeline: "$350K", stage: "Negotiation", score: 81, tier: "P2", highlight: "Proposal stage account with procurement review due this week" },
    ];
  }, [researchData, strategyData, intentData]);

  // AI recommendations from real strategy / outreach agents
  const aiRecommendations = React.useMemo(() => {
    const list = [];
    if (strategyData?.companies && strategyData.companies.length > 0) {
      for (const comp of strategyData.companies.slice(0, 3)) {
        list.push({
          title: `Engage ${comp.company_name} Leadership`,
          tag: comp.priority_tier === "P1" ? "High Priority" : "Best next action",
          copy: comp.recommended_pitch || comp.account_strategy || "Orchestrate outreach sequence.",
          link: "/strategy"
        });
      }
    } else {
      list.push(
        { title: "Prepare Novartis executive brief", tag: "High confidence", copy: "Their new AI lab signals a $620K expansion opportunity.", link: "/strategy" },
        { title: "Engage Airtel's cloud leadership", tag: "Best next action", copy: "Three new signals indicate an active modernization initiative.", link: "/intent" },
        { title: "Follow up with Lumen procurement", tag: "Time sensitive", copy: "Pricing review is scheduled for Friday.", link: "/outreach" }
      );
    }
    return list;
  }, [strategyData]);

  // Recent activity from real logs or fallback
  const recentActivity = React.useMemo(() => {
    if (state.logs && state.logs.length > 0) {
      return state.logs.slice(-4).reverse().map((log: any) => ({
        actor: log.agent || "AI Agent",
        action: log.message,
        time: log.timestamp || "Just now"
      }));
    }
    return [
      { actor: "Research Agent", action: "analyzed tech stack & hiring signals across target accounts", time: "12 min ago" },
      { actor: "Intent Agent", action: "detected high-intent signals and competitor migration trends", time: "38 min ago" },
      { actor: "Strategy Agent", action: "generated P1 account strategy matrices and whitespace opportunities", time: "1 hr ago" },
      { actor: "Outreach Agent", action: "crafted personalized executive briefs and email sequences", time: "2 hrs ago" },
    ];
  }, [state.logs]);

  return (
    <AppShell active="Dashboard">
      <div className="content">
        {/* Top Header */}
        <div className="header-row">
          <div>
            <div className="eyebrow">AUTONOMOUS ACCOUNT-BASED MARKETING</div>
            <h1 className="page-title">Good morning, {userName}</h1>
            <p className="subtle">
              {isRunning 
                ? "AI Agent Orchestration is currently running in the background."
                : isCompleted 
                ? "AI campaign intelligence successfully compiled. All agents completed."
                : "Here is your multi-agent account intelligence briefing for today."}
            </p>
          </div>
          <Link href="/agent-monitor" className="primary-button">
            <Rocket size={16} /> Run AI Campaign
          </Link>
        </div>

        {/* Live Campaign Status Banner (if running or completed) */}
        <AnimatePresence>
          {isRunning && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, height: 0 }}
              className="campaign-banner running"
            >
              <div className="banner-content">
                <div className="banner-indicator">
                  <span className="pulsing-dot" />
                  <Bot size={18} className="banner-icon" />
                </div>
                <div>
                  <strong>Autonomous Pipeline in Progress: {state.currentAgent || "Initializing Agents"}</strong>
                  <p>Orchestrating multi-agent research, buying committees, intent signals, and outreach.</p>
                </div>
              </div>
              <div className="banner-right">
                <div className="banner-progress">
                  <span>{state.progress}%</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${state.progress}%` }} />
                  </div>
                </div>
                <Link href="/agent-monitor" className="banner-btn">
                  Open Agent Monitor <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}

          {isCompleted && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="campaign-banner completed"
            >
              <div className="banner-content">
                <CheckCircle2 size={20} color="var(--success)" />
                <div>
                  <strong>Campaign Completed for {state.product}</strong>
                  <p>Full account intelligence, strategies, and outreach sequences are live.</p>
                </div>
              </div>
              <Link href="/agent-monitor" className="banner-btn secondary">
                View Agent Flow <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Metric Cards */}
        <section className="metrics">
          <article className="card">
            <div className="metric-label">
              High intent accounts
              <span className="metric-icon teal"><Zap size={15}/></span>
            </div>
            <div className="metric-number">{highIntentCount}</div>
            <div className="trend"><ArrowUpRight size={11}/> +12.5% this month</div>
          </article>

          <article className="card">
            <div className="metric-label">
              Target Accounts
              <span className="metric-icon"><Building2 size={15}/></span>
            </div>
            <div className="metric-number">{targetAccountsCount}</div>
            <div className="trend"><ArrowUpRight size={11}/> Verified Profiles</div>
          </article>

          <article className="card">
            <div className="metric-label">
              Stakeholders Mapped
              <span className="metric-icon purple"><UsersRound size={15}/></span>
            </div>
            <div className="metric-number">{stakeholdersCount}</div>
            <div className="trend"><ArrowUpRight size={11}/> Buying committee</div>
          </article>

          <article className="card">
            <div className="metric-label">
              Average Intent Score
              <span className="metric-icon orange"><Target size={15}/></span>
            </div>
            <div className="metric-number">{avgIntentScore}</div>
            <div className="trend"><ArrowUpRight size={11}/> +6 points this week</div>
          </article>

          <article className="card">
            <div className="metric-label">
              Outreach Assets Ready
              <span className="metric-icon green"><Mail size={15}/></span>
            </div>
            <div className="metric-number">{outreachAssetsCount}</div>
            <div className="trend"><ArrowUpRight size={11}/> Multi-channel ready</div>
          </article>
        </section>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Stack */}
          <div className="stack">
            {/* Revenue Pipeline Chart */}
            <article className="card">
              <div className="chart-head">
                <div>
                  <h2 className="card-title">Revenue pipeline</h2>
                  <p className="card-subtitle">Qualified pipeline projection by month</p>
                </div>
                <div className="period">Last 12 months</div>
              </div>
              <div className="chart-area">
                <div className="chart-bars">
                  {[42, 57, 50, 68, 61, 77, 70, 91, 84, 100, 92, 105].map((height, index) => (
                    <div className="bar-group" key={index}>
                      <div className="bar" style={{ height: `${height - 18}%` }} />
                      <div className="bar strong" style={{ height: `${height}%` }} />
                    </div>
                  ))}
                </div>
                <div className="chart-labels">
                  <span>Sep</span><span>Nov</span><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 15, fontSize: 11, color: "var(--muted)" }}>
                <span><b style={{ color: "var(--blue)" }}>â—</b> Current pipeline</span>
                <span><b style={{ color: "#D9E0FF" }}>â—</b> Previous period</span>
              </div>
            </article>

            {/* Priority Accounts Table */}
            <article className="card accounts-preview">
              <div className="chart-head">
                <div>
                  <h2 className="card-title">Priority Accounts</h2>
                  <p className="card-subtitle">Highest potential accounts requiring orchestrated outreach</p>
                </div>
                <Link href="/research" className="period hover-link">View all research</Link>
              </div>
              
              <div className="account-row header">
                <span>Account</span>
                <span>Pipeline</span>
                <span>Stage</span>
                <span>Intent score</span>
                <span>Priority</span>
              </div>

              {liveAccounts.map((acc, index) => (
                <div className="account-row" key={acc.name || index}>
                  <div className="account-name">
                    <span className="company-icon">{acc.name.slice(0, 2).toUpperCase()}</span>
                    <span>
                      {acc.name}
                      <small style={{ display: "block", color: "var(--muted)", fontWeight: 400, marginTop: 2 }}>
                        {acc.industry}
                      </small>
                    </span>
                  </div>
                  <span>{acc.pipeline}</span>
                  <span>{acc.stage}</span>
                  <span className="score">{acc.score}/100</span>
                  <span className={`pill ${acc.tier === "P1" ? "pill-p1" : acc.tier === "P2" ? "pill-p2" : ""}`}>
                    {acc.tier}
                  </span>
                </div>
              ))}
            </article>
          </div>

          {/* Right Stack */}
          <div className="stack">
            {/* AI Recommendations */}
            <article className="card">
              <div className="chart-head">
                <div>
                  <h2 className="card-title">AI Recommendations</h2>
                  <p className="card-subtitle">Generated by Strategy & Outreach Agents</p>
                </div>
                <Bot size={17} color="var(--violet)" />
              </div>
              {aiRecommendations.map((item, i) => (
                <Link href={item.link} key={i} className="suggestion-link">
                  <div className="suggestion">
                    <div className="suggestion-icon"><Lightbulb size={15} /></div>
                    <div style={{ flex: 1 }}>
                      <strong>{item.title}</strong>
                      <p>{item.copy}</p>
                    </div>
                    <span className="tag">{item.tag}</span>
                  </div>
                </Link>
              ))}
            </article>

            {/* Pipeline Funnel */}
            <article className="card">
              <div className="chart-head">
                <div>
                  <h2 className="card-title">Pipeline Funnel</h2>
                  <p className="card-subtitle">Account progression across stages</p>
                </div>
                <ChevronRight size={17} color="var(--faint)" />
              </div>
              <div className="funnel">
                {[
                  ["Targeted", "100%", "#E3E8FF"],
                  ["Engaged", "74%", "#C3CEFF"],
                  ["Qualified", "51%", "#9FB1FF"],
                  ["In Strategy", "32%", "#7490FF"],
                  ["Proposal", "18%", "#4B73FF"],
                ].map(([name, width, color]) => (
                  <div className="funnel-row" key={name}>
                    <span className="funnel-label">{name}</span>
                    <div className="funnel-bar" style={{ width, background: color }} />
                    <b className="funnel-value">{width}</b>
                  </div>
                ))}
              </div>
            </article>

            {/* Recent Agent Activity */}
            <article className="card">
              <div className="chart-head">
                <div>
                  <h2 className="card-title">Agent Activity Feed</h2>
                  <p className="card-subtitle">Live events from multi-agent pipeline</p>
                </div>
                <Link href="/agent-monitor" className="period hover-link">Live Monitor</Link>
              </div>
              {recentActivity.map((act: any, i: number) => (
                <div className="activity" key={i}>
                  <div className="dotline" />
                  <div>
                    <p><strong>{act.actor}</strong> {act.action}</p>
                    <span className="activity-time">{act.time}</span>
                  </div>
                </div>
              ))}
            </article>
          </div>
        </div>
      </div>

      <style jsx>{`
        .campaign-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: var(--radius-lg);
          margin-bottom: 24px;
          gap: 16px;
        }
        .campaign-banner.running {
          background: linear-gradient(135deg, #2A2145, #1B1916);
          border: 1px solid var(--violet);
          color: #fff;
          box-shadow: 0 10px 25px -5px rgba(128, 105, 255, 0.3);
        }
        .campaign-banner.completed {
          background: var(--success-soft);
          border: 1px solid #BDE5D2;
          color: var(--success);
        }
        .banner-content {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .banner-content p {
          margin: 3px 0 0;
          font-size: 12px;
          opacity: 0.85;
        }
        .banner-indicator {
          position: relative;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
          display: grid;
          place-items: center;
        }
        .pulsing-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--violet);
          box-shadow: 0 0 10px rgba(128, 105, 255, 0.8);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        .banner-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .banner-progress {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 700;
        }
        .progress-bar-container {
          width: 100px;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--blue), var(--pink));
          transition: width 0.3s ease;
        }
        .banner-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--violet);
          color: #fff;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: 0.2s;
        }
        .banner-btn:hover {
          background: #6C55E8;
        }
        .banner-btn.secondary {
          background: var(--success);
          color: #fff;
        }
        .hover-link {
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s;
        }
        .hover-link:hover {
          background: var(--border-soft);
          color: var(--blue);
        }
        .suggestion-link {
          text-decoration: none;
          color: inherit;
        }
        .suggestion-link:hover .suggestion {
          background: var(--canvas);
          border-radius: var(--radius-sm);
        }
        .pill-p1 {
          background: var(--success-soft) !important;
          color: var(--success) !important;
        }
        .pill-p2 {
          background: var(--warning-soft) !important;
          color: var(--warning) !important;
        }
        .account-row.header {
          color: var(--faint);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
          border-top: none;
        }
      `}</style>
    </AppShell>
  );
}

