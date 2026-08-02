"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  Activity, AlertCircle, BarChart3, Brain, Building2, CheckCircle2,
  Clock, ExternalLink, Globe, Linkedin, MessageSquare, Search,
  Shield, Sparkles, Target, TrendingUp, Users, Zap,
} from "lucide-react";

// ── Static research data (Research Agent output) ──────────────────────────────

const DATA = {
  metadata: {
    agent: "Research Agent",
    status: "completed",
    execution_time: "18.7 seconds",
    confidence: 96,
    generated_at: "2026-08-02T12:10:00Z",
  },
  company_profile: {
    company_name: "Infosys",
    industry: "IT Services and Consulting",
    headquarters: "Bengaluru, India",
    employees: 340000,
    website: "https://www.infosys.com",
    linkedin_followers: 2900000,
  },
  company_summary: {
    overview: "Infosys is a global IT consulting and digital transformation company providing cloud, AI, cybersecurity and enterprise software services.",
    cloud_focus: ["AWS", "Azure", "Google Cloud"],
    business_model: "Enterprise Consulting",
  },
  website_analysis: {
    products: ["Cloud Services", "Generative AI", "Data Analytics", "Cyber Security"],
    services: ["Digital Transformation", "Cloud Migration", "Application Modernization"],
    technology_stack: ["Azure", "AWS", "Terraform", "Kubernetes"],
    recent_announcements: ["Expansion of AI capabilities", "Enterprise cloud modernization initiatives"],
  },
  linkedin_analysis: {
    employee_growth: 8,
    open_positions: 412,
    cloud_jobs: 128,
    azure_jobs: 74,
    aws_jobs: 61,
    ai_jobs: 142,
    top_hiring_roles: ["Azure Cloud Engineer", "DevOps Engineer", "AI Engineer", "Cloud Architect"],
    recent_posts: ["Enterprise AI", "Cloud Transformation", "Responsible AI"],
  },
  reddit_analysis: {
    posts_analyzed: 68,
    overall_sentiment: "Positive",
    positive: 63,
    neutral: 21,
    negative: 16,
    top_discussions: ["Azure Pricing", "Azure vs AWS", "Azure Kubernetes", "Enterprise AI", "Cloud Migration"],
    community_feedback: [
      "Azure AI is suitable for enterprise workloads",
      "Pricing needs optimization",
      "Azure Kubernetes adoption is increasing",
    ],
  },
  market_intelligence: {
    competitors: ["AWS", "Google Cloud", "Anthropic Claude"],
    market_trends: ["Growing AI adoption", "Migration to Kubernetes", "Responsible AI", "Cloud Cost Optimization"],
  },
  research_scores: {
    website_score: 96,
    linkedin_score: 91,
    reddit_score: 82,
    overall_confidence: 93,
  },
  key_findings: [
    "Company is actively hiring Azure Engineers.",
    "Enterprise AI initiatives are expanding.",
    "Cloud modernization projects are ongoing.",
    "Azure pricing discussions are increasing.",
    "Kubernetes adoption is high.",
  ],
  business_opportunities: [
    "Azure AI", "Azure Kubernetes Service", "Azure OpenAI", "Azure Security", "Azure Cost Optimization",
  ],
  evidence: [
    { source: "Website", fact: "Enterprise AI initiative" },
    { source: "LinkedIn", fact: "74 Azure jobs" },
    { source: "Reddit", fact: "Multiple Azure pricing discussions" },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 72 }: { score: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={7} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fill: "#0f172a", fontSize: size * 0.22, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {score}
      </text>
    </svg>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ flex: 1, height: 8, background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.8s ease" }} />
    </div>
  );
}

function Tag({ label, color = "#eff6ff", text = "#2563eb" }: { label: string; color?: string; text?: string }) {
  return (
    <span style={{ background: color, color: text, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e7eaf0", borderRadius: 16, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 1, marginBottom: 14, textTransform: "uppercase" }}>{children}</div>;
}

// ── Sub-sections ──────────────────────────────────────────────────────────────

function AgentMetaBar() {
  const { metadata } = DATA;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, marginBottom: 24, flexWrap: "wrap" }}>
      <CheckCircle2 size={16} color="#16a34a" />
      <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>{metadata.agent} — {metadata.status.toUpperCase()}</span>
      <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>Executed in {metadata.execution_time}</span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <Clock size={13} color="#64748b" />
        <span style={{ fontSize: 11, color: "#64748b" }}>{new Date(metadata.generated_at).toLocaleString()}</span>
        <Tag label={`${metadata.confidence}% Confidence`} color="#dcfce7" text="#15803d" />
      </div>
    </div>
  );
}

function CompanyHeader() {
  const { company_profile, company_summary } = DATA;
  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Building2 size={26} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#2563eb", letterSpacing: 1 }}>RESEARCH TARGET</div>
          <h2 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 800, letterSpacing: -0.8, color: "#0f172a" }}>{company_profile.company_name}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.55, maxWidth: 600 }}>{company_summary.overview}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <Tag label={company_profile.industry} />
            <Tag label={company_profile.headquarters} color="#f5f3ff" text="#7c3aed" />
            <Tag label={`${(company_profile.employees / 1000).toFixed(0)}K employees`} color="#f0fdf4" text="#16a34a" />
            <Tag label={`${(company_profile.linkedin_followers / 1000000).toFixed(1)}M LinkedIn`} color="#eff6ff" text="#0284c7" />
            <Tag label={company_summary.business_model} color="#fff7ed" text="#c2410c" />
          </div>
        </div>
        <a href={company_profile.website} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#2563eb", fontWeight: 700, textDecoration: "none", border: "1px solid #dbeafe", padding: "7px 12px", borderRadius: 9 }}>
          <Globe size={13} /> Website <ExternalLink size={11} />
        </a>
      </div>
    </Card>
  );
}

function ScoreCards() {
  const { research_scores } = DATA;
  const scores = [
    { label: "Website Score", value: research_scores.website_score, color: "#2563eb", icon: Globe },
    { label: "LinkedIn Score", value: research_scores.linkedin_score, color: "#0284c7", icon: Linkedin },
    { label: "Reddit Score", value: research_scores.reddit_score, color: "#f97316", icon: MessageSquare },
    { label: "Overall Confidence", value: research_scores.overall_confidence, color: "#16a34a", icon: Shield },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
      {scores.map(({ label, value, color, icon: Icon }) => (
        <Card key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 12px" }}>
          <ScoreRing score={value} color={color} />
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Icon size={12} color={color} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "center" }}>{label}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function HiringSignals() {
  const { linkedin_analysis } = DATA;
  const roles = [
    { label: "AI Jobs", value: linkedin_analysis.ai_jobs, color: "#7c3aed" },
    { label: "Cloud Jobs", value: linkedin_analysis.cloud_jobs, color: "#2563eb" },
    { label: "Azure Jobs", value: linkedin_analysis.azure_jobs, color: "#0284c7" },
    { label: "AWS Jobs", value: linkedin_analysis.aws_jobs, color: "#f97316" },
  ];
  const maxVal = Math.max(...roles.map(r => r.value));

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <SectionTitle>LinkedIn Hiring Signals</SectionTitle>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1, color: "#0f172a" }}>
            {linkedin_analysis.open_positions} <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>open roles</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>Employee growth</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>+{linkedin_analysis.employee_growth}%</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        {roles.map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", width: 80, flexShrink: 0 }}>{label}</span>
            <Bar value={value} max={maxVal} color={color} />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", width: 32, textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>TOP HIRING ROLES</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {linkedin_analysis.top_hiring_roles.map(role => (
            <Tag key={role} label={role} color="#eff6ff" text="#2563eb" />
          ))}
        </div>
      </div>
    </Card>
  );
}

function RedditSentiment() {
  const { reddit_analysis } = DATA;
  const total = reddit_analysis.positive + reddit_analysis.neutral + reddit_analysis.negative;
  const segments = [
    { label: "Positive", value: reddit_analysis.positive, color: "#16a34a", bg: "#f0fdf4", text: "#15803d" },
    { label: "Neutral", value: reddit_analysis.neutral, color: "#94a3b8", bg: "#f8fafc", text: "#475569" },
    { label: "Negative", value: reddit_analysis.negative, color: "#dc2626", bg: "#fef2f2", text: "#b91c1c" },
  ];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <SectionTitle>Reddit Sentiment Analysis</SectionTitle>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1, color: "#0f172a" }}>
            {reddit_analysis.posts_analyzed} <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>posts analyzed</span>
          </div>
        </div>
        <Tag label={reddit_analysis.overall_sentiment} color="#f0fdf4" text="#15803d" />
      </div>

      {/* Stacked bar */}
      <div style={{ display: "flex", height: 12, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
        {segments.map(({ label, value, color }) => (
          <div key={label} style={{ width: `${(value / total) * 100}%`, background: color, transition: "width 0.8s ease" }} title={`${label}: ${value}`} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {segments.map(({ label, value, color, bg, text }) => (
          <div key={label} style={{ flex: 1, background: bg, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: text }}>{label}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{Math.round((value / total) * 100)}%</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>TOP DISCUSSIONS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {reddit_analysis.top_discussions.map(d => (
            <Tag key={d} label={d} color="#fff7ed" text="#c2410c" />
          ))}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {reddit_analysis.community_feedback.map((fb, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#475569", padding: "6px 0", borderTop: i > 0 ? "1px solid #f1f5f9" : "none" }}>
              <MessageSquare size={12} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
              {fb}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function TechStack() {
  const { website_analysis, company_summary } = DATA;
  return (
    <Card>
      <SectionTitle>Technology Stack & Products</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Cloud Focus</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {company_summary.cloud_focus.map(c => (
              <Tag key={c} label={c} color="#eff6ff" text="#2563eb" />
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Tech Stack</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {website_analysis.technology_stack.map(t => (
              <Tag key={t} label={t} color="#f5f3ff" text="#7c3aed" />
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Products</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {website_analysis.products.map(p => (
              <Tag key={p} label={p} color="#f0fdf4" text="#16a34a" />
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Services</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {website_analysis.services.map(s => (
              <Tag key={s} label={s} color="#fff7ed" text="#c2410c" />
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Recent Announcements</div>
        {website_analysis.recent_announcements.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#475569", padding: "5px 0" }}>
            <Zap size={12} color="#f59e0b" />
            {a}
          </div>
        ))}
      </div>
    </Card>
  );
}

function MarketIntelligence() {
  const { market_intelligence } = DATA;
  return (
    <Card>
      <SectionTitle>Market Intelligence</SectionTitle>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Competitors</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {market_intelligence.competitors.map(c => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px" }}>
              <AlertCircle size={11} color="#dc2626" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Market Trends</div>
        <div style={{ display: "grid", gap: 7 }}>
          {market_intelligence.market_trends.map((t, i) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 9, border: "1px solid #e7eaf0" }}>
              <TrendingUp size={13} color="#2563eb" />
              <span style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function KeyFindings() {
  const { key_findings, evidence } = DATA;
  const sourceColors: Record<string, [string, string]> = {
    Website: ["#eff6ff", "#2563eb"],
    LinkedIn: ["#f0f9ff", "#0284c7"],
    Reddit: ["#fff7ed", "#c2410c"],
  };
  return (
    <Card>
      <SectionTitle>Key Findings & Evidence</SectionTitle>
      <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
        {key_findings.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e7eaf0" }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: "#eff6ff", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <CheckCircle2 size={13} color="#2563eb" />
            </div>
            <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>EVIDENCE SOURCES</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {evidence.map((e, i) => {
          const [bg, text] = sourceColors[e.source] || ["#f1f5f9", "#475569"];
          return (
            <div key={i} style={{ background: bg, border: `1px solid ${text}22`, borderRadius: 10, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: text, marginBottom: 2 }}>{e.source.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: "#334155", fontWeight: 600 }}>{e.fact}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BusinessOpportunities() {
  const { business_opportunities } = DATA;
  const icons = [Target, Zap, Brain, Shield, BarChart3];
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#16a34a", "#f59e0b"];
  return (
    <Card>
      <SectionTitle>Business Opportunities Identified</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {business_opportunities.map((opp, i) => {
          const Icon = icons[i % icons.length];
          const color = colors[i % colors.length];
          return (
            <div key={opp} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f8fafc", border: "1px solid #e7eaf0", borderRadius: 12, borderLeft: `3px solid ${color}` }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "18", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon size={14} color={color} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{opp}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LinkedInPostTrends() {
  const { linkedin_analysis } = DATA;
  return (
    <Card>
      <SectionTitle>LinkedIn Content Trends</SectionTitle>
      <div style={{ display: "grid", gap: 8 }}>
        {linkedin_analysis.recent_posts.map((post, i) => {
          const widths = [92, 78, 65];
          return (
            <div key={post} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", width: 160, flexShrink: 0 }}>{post}</span>
              <div style={{ flex: 1, height: 8, background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${widths[i]}%`, height: "100%", background: "#0284c7", borderRadius: 6 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", width: 36, textAlign: "right" }}>{widths[i]}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  return (
    <AppShell active="Research Center">
      <div className="content">

        {/* Page header */}
        <div className="header-row" style={{ marginBottom: 20 }}>
          <div>
            <div className="eyebrow">RESEARCH AGENT OUTPUT</div>
            <h1 className="page-title">Account Intelligence — Infosys</h1>
            <p className="subtle">AI-generated research report. All findings are evidence-backed and source-verified.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="primary-button" style={{ background: "#7c3aed" }}>
              <Sparkles size={15} /> Run Strategy Agent
            </button>
            <button className="primary-button">
              <Search size={15} /> Re-research
            </button>
          </div>
        </div>

        {/* Agent status bar */}
        <AgentMetaBar />

        {/* Company header */}
        <CompanyHeader />

        {/* Score cards */}
        <ScoreCards />

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 18, marginBottom: 18 }}>
          <HiringSignals />
          <RedditSentiment />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 18 }}>
          <TechStack />
          <div style={{ display: "grid", gap: 18 }}>
            <MarketIntelligence />
            <LinkedInPostTrends />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <KeyFindings />
          <BusinessOpportunities />
        </div>

      </div>
    </AppShell>
  );
}
