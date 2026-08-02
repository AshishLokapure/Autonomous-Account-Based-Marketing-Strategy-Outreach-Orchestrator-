export interface Evidence {
  source: string;
  fact: string;
}

export interface CompanyProfile {
  company_name: string;
  industry: string;
  headquarters: string;
  employees: number;
  website: string;
  linkedin_followers: number;
}

export interface CompanySummary {
  overview: string;
  cloud_focus: string[];
  business_model: string;
}

export interface WebsiteAnalysis {
  products: string[];
  services: string[];
  technology_stack: string[];
  recent_announcements: string[];
}

export interface LinkedInAnalysis {
  employee_growth: number;
  open_positions: number;
  cloud_jobs: number;
  azure_jobs: number;
  aws_jobs: number;
  ai_jobs: number;
  top_hiring_roles: string[];
  recent_posts: string[];
}

export interface RedditAnalysis {
  posts_analyzed: number;
  overall_sentiment: string;
  positive: number;
  neutral: number;
  negative: number;
  top_discussions: string[];
  community_feedback: string[];
}

export interface ResearchScores {
  website_score: number;
  linkedin_score: number;
  reddit_score: number;
  overall_confidence: number;
}

export interface CompanyResearch {
  company_profile: CompanyProfile;
  company_summary: CompanySummary;
  website_analysis: WebsiteAnalysis;
  linkedin_analysis: LinkedInAnalysis;
  reddit_analysis: RedditAnalysis;
  market_intelligence: {
    competitors: string[];
    market_trends: string[];
  };
  research_scores: ResearchScores;
  key_findings: string[];
  business_opportunities: string[];
  evidence: Evidence[];
}

export interface ResearchResult {
  product: string;
  organization: string;
  campaign: string;
  companies_analyzed: number;
  companies: CompanyResearch[];
}

export interface Stakeholder {
  name: string;
  title: string;
  type: "decision_maker" | "champion" | "influencer" | "blocker";
  influence: "High" | "Medium" | "Low";
  relationship: string;
  recent_engagement: string;
}

export interface StakeholderCompany {
  company_name: string;
  stakeholders: Stakeholder[];
  buying_committee_size: number;
  meeting_analytics: {
    meetings_held: number;
    avg_sentiment: number;
    key_topics: string[];
  };
  email_analytics: {
    threads_analyzed: number;
    reply_rate: string | number;
    last_contact: string;
  };
  evidence: Evidence[];
}

export interface StakeholderResult {
  product: string;
  totals: {
    stakeholders_mapped: number;
    decision_makers: number;
    champions: number;
    influencers: number;
    blockers: number;
  };
  companies: StakeholderCompany[];
}

export interface BuyingSignal {
  signal: string;
  strength: string;
  source: string;
}

export interface CompetitorMention {
  competitor: string;
  context: string;
}

export interface IntentCompany {
  company_name: string;
  intent_score: number;
  buying_score: number;
  urgency: "High" | "Medium" | "Low";
  buying_signals: BuyingSignal[];
  competitor_mentions: CompetitorMention[];
  objections: string[];
  predicted_timeline: string;
  evidence: Evidence[];
}

export interface IntentResult {
  product: string;
  totals: {
    average_intent_score: number;
    high_intent_accounts: number;
    buying_signals_detected: number;
  };
  companies: IntentCompany[];
}

export interface StrategyCompany {
  company_name: string;
  priority_score: number;
  priority_tier: "P1" | "P2" | "P3";
  account_strategy: string;
  recommended_pitch: string;
  channel_strategy: string;
  whitespace_opportunities: string[];
  risks: string[];
  timeline: string;
  next_actions: string[];
  evidence: Evidence[];
}

export interface StrategyResult {
  product: string;
  totals: {
    p1_accounts: number;
    p2_accounts: number;
    p3_accounts: number;
    avg_priority_score: number;
    strategies_generated: number;
  };
  companies: StrategyCompany[];
}

export interface ExecutiveEmail {
  to: string;
  subject: string;
  body: string;
}

export interface LinkedInMessage {
  to: string;
  body: string;
}

export interface CallScript {
  opening: string;
  discovery_questions: string[];
  close: string;
}

export interface OutreachCompany {
  company_name: string;
  executive_email: ExecutiveEmail;
  linkedin_message: LinkedInMessage;
  call_script: CallScript;
  next_best_action: string;
  evidence: Evidence[];
}

export interface OutreachResult {
  product: string;
  totals: {
    emails_generated: number;
    linkedin_messages: number;
    call_scripts: number;
    total_assets: number;
  };
  companies: OutreachCompany[];
}

export interface AgentRunState {
  runId: string;
  product: string;
  status: "idle" | "starting" | "running" | "completed" | "failed";
  progress: number;
  currentAgent: string | null;
  agentProgress: Record<string, number>;
  agentStatuses: Record<string, "idle" | "running" | "completed" | "failed">;
  agentResults: {
    research?: ResearchResult;
    stakeholder?: StakeholderResult;
    intent?: IntentResult;
    strategy?: StrategyResult;
    outreach?: OutreachResult;
    [key: string]: any;
  };
  logs: Array<{
    id?: string;
    timestamp: string;
    level: "info" | "success" | "warning" | "error";
    agent: string;
    message: string;
  }>;
  error?: string | null;
}
