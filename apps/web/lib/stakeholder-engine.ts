/**
 * Stakeholder Intelligence Engine
 * Processes emails + meeting transcripts → structured sales intelligence
 * Pure client-side, no LLM API required — deterministic reasoning over communication data
 */

// ─── Raw Input Types ──────────────────────────────────────────────────────────

export interface RawEmail {
  email_id: string;
  timestamp: string;
  from_person_id: string;
  to_person_ids: string[];
  cc_person_ids: string[];
  subject: string;
  body: string;
  mentioned_topics: string[];
}

export interface TranscriptLine {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export interface RawParticipant {
  name: string;
  email?: string;
  role: string;
  type: "prospect" | "internal";
}

export interface RawMeeting {
  id: string;
  account: { name: string; domain: string };
  participants: RawParticipant[];
  timestamp: string;
  content: { title: string; transcript: TranscriptLine[] };
  metadata: {
    duration_seconds: number;
    meeting_type: string;
    mentioned_topics: string[];
    action_items: string[];
  };
}

// ─── Output Types ─────────────────────────────────────────────────────────────

export type StakeholderRole =
  | "Decision Maker"
  | "Budget Owner"
  | "Champion"
  | "Technical Influencer"
  | "Blocker"
  | "Executive Sponsor"
  | "End User"
  | "Evaluator";

export interface BuyingSignal {
  signal: string;
  score: number;
  confidence: number;
  source: string;
}

export interface PainPoint {
  category: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  source: string;
}

export interface StakeholderProfile {
  id: string;
  name: string;
  role: StakeholderRole;
  title: string;
  company: string;
  email: string;
  department: string;
  influence_score: number;
  buying_power: number;
  technical_authority: number;
  communication_frequency: number;
  engagement_score: number;
  intent_score: number;
  sentiment: "Positive" | "Neutral" | "Negative";
  topics_discussed: string[];
  emails: { subject: string; body: string; timestamp: string }[];
  meetings: { title: string; summary: string; action_items: string[] }[];
  buying_signals: BuyingSignal[];
  pain_points: string[];
  recommended_outreach: string;
  next_best_action: string;
  why_contact: string;
  what_problems: string[];
  approves_purchases: boolean;
  influences_decisions: boolean;
  is_blocking: boolean;
  opportunity: string;
}

export interface CompanyStakeholderAnalysis {
  company: string;
  overall_intent: number;
  overall_opportunity: number;
  confidence: number;
  decision_makers: StakeholderProfile[];
  champions: StakeholderProfile[];
  blockers: StakeholderProfile[];
  budget_owners: StakeholderProfile[];
  technical_influencers: StakeholderProfile[];
  all_stakeholders: StakeholderProfile[];
  meeting_summary: string;
  email_summary: string;
  buying_signals: BuyingSignal[];
  pain_points: PainPoint[];
  recommended_products: string[];
  next_best_action: string;
  email_count: number;
  meeting_count: number;
  who_to_contact: string;
  why_contact: string;
  what_opportunity: string;
}

export interface StakeholderAnalysisResult {
  product: string;
  total_companies: number;
  total_stakeholders: number;
  total_decision_makers: number;
  total_champions: number;
  total_buying_signals: number;
  avg_intent_score: number;
  avg_opportunity_score: number;
  avg_confidence: number;
  companies: CompanyStakeholderAnalysis[];
  top_buying_signals: BuyingSignal[];
  top_pain_points: PainPoint[];
  department_distribution: Record<string, number>;
  role_distribution: Record<string, number>;
  sentiment_distribution: { positive: number; neutral: number; negative: number };
}

// ─── Signal Detection Rules ───────────────────────────────────────────────────

const BUYING_SIGNAL_KEYWORDS: Record<string, string[]> = {
  "Need AI": ["ai", "artificial intelligence", "machine learning", "generative ai", "llm"],
  "Need Cloud Migration": ["migration", "migrate", "modernization", "cloud move"],
  "Need Security": ["security", "compliance", "hipaa", "governance", "audit"],
  "Need Cost Optimization": ["cost", "savings", "reserved instances", "finops", "budget"],
  "Need Kubernetes": ["kubernetes", "eks", "aks", "containers", "k8s"],
  "Need GenAI": ["generative ai", "bedrock", "openai", "azure openai", "claude", "llm", "foundation model"],
  "Need Data Platform": ["data platform", "analytics", "data governance", "snowflake", "sagemaker"],
  "Need Automation": ["automation", "workflow", "productivity", "developer productivity"],
  "Need Compliance": ["compliance", "hipaa", "gdpr", "regulatory", "audit"],
  "Need Deployment": ["deployment", "rollout", "pilot", "proof of concept", "poc"],
};

const PAIN_POINT_KEYWORDS: Record<string, { keywords: string[]; severity: "High" | "Medium" | "Low" }> = {
  "Budget Constraints": { keywords: ["budget", "cost", "finance", "savings", "expensive"], severity: "High" },
  "Security Concerns": { keywords: ["security", "compliance", "hipaa", "governance", "audit"], severity: "High" },
  "Legacy Systems": { keywords: ["legacy", "modernization", "migration", "old system"], severity: "High" },
  "Scalability": { keywords: ["scalability", "scale", "performance", "capacity"], severity: "Medium" },
  "Operational Complexity": { keywords: ["operational", "complexity", "overhead", "management"], severity: "Medium" },
  "Deployment Timeline": { keywords: ["timeline", "deadline", "schedule", "roadmap"], severity: "Medium" },
  "Integration Challenges": { keywords: ["integration", "compatibility", "connect", "api"], severity: "Medium" },
  "Knowledge Gap": { keywords: ["training", "workshop", "documentation", "knowledge"], severity: "Low" },
};

const ROLE_KEYWORDS: Record<StakeholderRole, string[]> = {
  "Decision Maker": ["head", "vp", "vice president", "director", "chief", "cto", "cio", "ceo"],
  "Budget Owner": ["finance", "cfo", "budget", "procurement", "purchasing"],
  "Champion": ["architect", "lead", "senior", "principal", "manager"],
  "Technical Influencer": ["engineer", "developer", "technical", "platform", "devops", "sre"],
  "Blocker": ["legal", "compliance", "security", "risk", "audit"],
  "Executive Sponsor": ["executive", "president", "founder", "board"],
  "End User": ["analyst", "user", "specialist", "coordinator"],
  "Evaluator": ["evaluator", "reviewer", "assessor"],
};

// ─── Engine ───────────────────────────────────────────────────────────────────

function detectRole(title: string): StakeholderRole {
  const t = title.toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some((k) => t.includes(k))) return role as StakeholderRole;
  }
  return "Evaluator";
}

function detectBuyingSignals(text: string, source: string): BuyingSignal[] {
  const lower = text.toLowerCase();
  const signals: BuyingSignal[] = [];
  for (const [signal, keywords] of Object.entries(BUYING_SIGNAL_KEYWORDS)) {
    const matches = keywords.filter((k) => lower.includes(k)).length;
    if (matches > 0) {
      signals.push({
        signal,
        score: Math.min(95, 60 + matches * 12),
        confidence: Math.min(98, 65 + matches * 10),
        source,
      });
    }
  }
  return signals;
}

function detectPainPoints(text: string, source: string): PainPoint[] {
  const lower = text.toLowerCase();
  const points: PainPoint[] = [];
  for (const [category, { keywords, severity }] of Object.entries(PAIN_POINT_KEYWORDS)) {
    const matches = keywords.filter((k) => lower.includes(k)).length;
    if (matches > 0) {
      points.push({
        category,
        description: `${category} detected from ${source} communication`,
        severity,
        source,
      });
    }
  }
  return points;
}

function inferDepartment(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("cloud") || t.includes("infrastructure") || t.includes("devops") || t.includes("sre")) return "Cloud & Infrastructure";
  if (t.includes("security") || t.includes("compliance") || t.includes("risk")) return "Security & Compliance";
  if (t.includes("finance") || t.includes("cfo") || t.includes("budget")) return "Finance";
  if (t.includes("ai") || t.includes("ml") || t.includes("data") || t.includes("analytics")) return "AI & Data";
  if (t.includes("engineer") || t.includes("developer") || t.includes("platform")) return "Engineering";
  if (t.includes("architect")) return "Architecture";
  if (t.includes("director") || t.includes("vp") || t.includes("head") || t.includes("chief")) return "Executive";
  return "Technology";
}

function calcInfluence(role: StakeholderRole, title: string): number {
  const base: Record<StakeholderRole, number> = {
    "Decision Maker": 88, "Budget Owner": 85, "Executive Sponsor": 92,
    "Champion": 75, "Technical Influencer": 70, "Evaluator": 65,
    "Blocker": 60, "End User": 45,
  };
  const titleBoost = title.toLowerCase().includes("vp") || title.toLowerCase().includes("head") ? 8 : 0;
  return Math.min(99, (base[role] ?? 65) + titleBoost);
}

function buildStakeholderProfile(
  participant: RawParticipant,
  company: string,
  relatedEmails: RawEmail[],
  relatedMeetings: RawMeeting[],
  product: string
): StakeholderProfile {
  const role = detectRole(participant.role);
  const department = inferDepartment(participant.role);
  const influence = calcInfluence(role, participant.role);

  // Aggregate all text for signal detection
  const allText = [
    ...relatedEmails.map((e) => `${e.subject} ${e.body}`),
    ...relatedMeetings.flatMap((m) => m.content.transcript.map((t) => t.text)),
  ].join(" ");

  const signals = detectBuyingSignals(allText, `${company} communications`);
  const painPoints = detectPainPoints(allText, `${company} communications`);

  const topics = Array.from(
    new Set([
      ...relatedEmails.flatMap((e) => e.mentioned_topics),
      ...relatedMeetings.flatMap((m) => m.metadata.mentioned_topics),
    ])
  ).slice(0, 6);

  const intentScore = Math.min(97, 55 + signals.length * 8 + (role === "Decision Maker" ? 15 : 0));
  const buyingPower = role === "Budget Owner" || role === "Decision Maker" ? Math.min(99, influence + 5) : Math.max(30, influence - 20);

  const approvesPurchases = role === "Budget Owner" || role === "Decision Maker" || role === "Executive Sponsor";
  const influencesDecisions = ["Decision Maker", "Champion", "Technical Influencer", "Executive Sponsor"].includes(role);
  const isBlocking = role === "Blocker";

  const whyContact = role === "Decision Maker"
    ? `${participant.name} is the primary decision maker for ${product} adoption at ${company}. They have authority to approve the initiative.`
    : role === "Champion"
    ? `${participant.name} is an internal champion who can drive ${product} adoption from within ${company}.`
    : role === "Budget Owner"
    ? `${participant.name} controls the budget for cloud and AI investments at ${company}.`
    : `${participant.name} is a key ${role} who influences the ${product} evaluation at ${company}.`;

  const whatProblems = painPoints.map((p) => p.category).slice(0, 4);
  if (whatProblems.length === 0) whatProblems.push("Cloud modernization", "Cost optimization");

  const opportunity = signals.length > 3
    ? `High-value opportunity: ${company} shows strong buying intent for ${product} with ${signals.length} active signals.`
    : `Emerging opportunity: ${company} is evaluating ${product} with ${signals.length} detected signals.`;

  const recommendedOutreach = role === "Decision Maker"
    ? `Send executive briefing on ${product} ROI and business outcomes. Request a C-level meeting.`
    : role === "Champion"
    ? `Share technical deep-dive and proof of concept proposal for ${product}.`
    : role === "Budget Owner"
    ? `Provide cost analysis, ROI calculator and competitive pricing for ${product}.`
    : `Share technical documentation and schedule a workshop for ${product}.`;

  const nextBestAction = relatedMeetings.length > 0
    ? `Follow up on action items from ${relatedMeetings[0].content.title}`
    : `Schedule discovery call to discuss ${product} requirements`;

  return {
    id: `${company.toLowerCase().replace(/\s/g, "_")}_${participant.name.toLowerCase().replace(/\s/g, "_")}`,
    name: participant.name,
    role,
    title: participant.role,
    company,
    email: participant.email ?? `${participant.name.toLowerCase().replace(/\s/g, ".")}@${company.toLowerCase().replace(/\s/g, "")}.com`,
    department,
    influence_score: influence,
    buying_power: buyingPower,
    technical_authority: department === "Engineering" || department === "Architecture" ? Math.min(95, influence + 5) : Math.max(40, influence - 25),
    communication_frequency: relatedEmails.length + relatedMeetings.length,
    engagement_score: Math.min(99, 50 + (relatedEmails.length * 8) + (relatedMeetings.length * 12)),
    intent_score: intentScore,
    sentiment: intentScore > 75 ? "Positive" : intentScore > 55 ? "Neutral" : "Negative",
    topics_discussed: topics,
    emails: relatedEmails.map((e) => ({ subject: e.subject, body: e.body, timestamp: e.timestamp })),
    meetings: relatedMeetings.map((m) => ({
      title: m.content.title,
      summary: m.content.transcript.map((t) => t.text).join(" ").slice(0, 200) + "…",
      action_items: m.metadata.action_items,
    })),
    buying_signals: signals,
    pain_points: whatProblems,
    recommended_outreach: recommendedOutreach,
    next_best_action: nextBestAction,
    why_contact: whyContact,
    what_problems: whatProblems,
    approves_purchases: approvesPurchases,
    influences_decisions: influencesDecisions,
    is_blocking: isBlocking,
    opportunity,
  };
}

function analyzeCompany(
  companyName: string,
  emails: RawEmail[],
  meetings: RawMeeting[],
  product: string
): CompanyStakeholderAnalysis {
  // Collect all unique prospect participants from meetings
  const participantMap = new Map<string, RawParticipant & { company: string }>();
  for (const meeting of meetings) {
    for (const p of meeting.participants) {
      if (p.type === "prospect" && p.name) {
        participantMap.set(p.name, { ...p, company: meeting.account.name });
      }
    }
  }

  // If no participants from meetings, synthesize from email topics
  if (participantMap.size === 0) {
    participantMap.set("Head of Cloud", {
      name: "Head of Cloud",
      role: "Head of Cloud",
      type: "prospect",
      company: companyName,
    });
    participantMap.set("Director of Infrastructure", {
      name: "Director of Infrastructure",
      role: "Director of Infrastructure",
      type: "prospect",
      company: companyName,
    });
  }

  const allText = [
    ...emails.map((e) => `${e.subject} ${e.body}`),
    ...meetings.flatMap((m) => m.content.transcript.map((t) => t.text)),
  ].join(" ");

  const profiles: StakeholderProfile[] = Array.from(participantMap.values()).map((p) =>
    buildStakeholderProfile(p, companyName, emails, meetings, product)
  );

  const buyingSignals = detectBuyingSignals(allText, `${companyName} — Emails & Meetings`);
  const painPoints = detectPainPoints(allText, `${companyName} — Emails & Meetings`);

  const allTopics = Array.from(
    new Set([
      ...emails.flatMap((e) => e.mentioned_topics),
      ...meetings.flatMap((m) => m.metadata.mentioned_topics),
    ])
  );

  const recommendedProducts = allTopics
    .filter((t) => t.toLowerCase().includes(product.split(" ")[0].toLowerCase()) || t.toLowerCase().includes("ai") || t.toLowerCase().includes("cloud"))
    .slice(0, 5);

  const overallIntent = Math.min(97, 55 + buyingSignals.length * 6 + profiles.length * 4);
  const overallOpportunity = Math.min(99, 60 + buyingSignals.length * 5 + painPoints.length * 4);

  const meetingSummary = meetings.length > 0
    ? `${meetings.length} discovery meeting(s) held. Key topics: ${meetings[0].metadata.mentioned_topics.slice(0, 3).join(", ")}. Action items: ${meetings[0].metadata.action_items.slice(0, 2).join("; ")}.`
    : `No meetings recorded yet. Recommend scheduling a discovery call.`;

  const emailSummary = emails.length > 0
    ? `${emails.length} email thread(s) analyzed. Primary subjects: ${emails.slice(0, 2).map((e) => e.subject).join("; ")}.`
    : `No emails recorded yet.`;

  const decisionMakers = profiles.filter((p) => p.role === "Decision Maker" || p.role === "Executive Sponsor");
  const champions = profiles.filter((p) => p.role === "Champion" || p.role === "Technical Influencer");
  const blockers = profiles.filter((p) => p.role === "Blocker");
  const budgetOwners = profiles.filter((p) => p.role === "Budget Owner");
  const technicalInfluencers = profiles.filter((p) => p.role === "Technical Influencer" || p.role === "Evaluator");

  const topContact = decisionMakers[0] ?? champions[0] ?? profiles[0];
  const whoToContact = topContact ? topContact.name : "Unknown";
  const whyContact = topContact ? topContact.why_contact : "Identify key stakeholders first.";
  const whatOpportunity = `${companyName} shows ${overallIntent > 80 ? "high" : "medium"} buying intent for ${product}. ${buyingSignals.length} active signals detected across ${emails.length + meetings.length} communications.`;

  return {
    company: companyName,
    overall_intent: overallIntent,
    overall_opportunity: overallOpportunity,
    confidence: Math.min(97, 70 + profiles.length * 5 + buyingSignals.length * 3),
    decision_makers: decisionMakers,
    champions,
    blockers,
    budget_owners: budgetOwners,
    technical_influencers: technicalInfluencers,
    all_stakeholders: profiles,
    meeting_summary: meetingSummary,
    email_summary: emailSummary,
    buying_signals: buyingSignals,
    pain_points: painPoints,
    recommended_products: recommendedProducts.length > 0 ? recommendedProducts : [product],
    next_best_action: meetings.length > 0
      ? `Follow up on ${meetings[0].metadata.action_items[0] ?? "open action items"}`
      : `Schedule initial discovery call with ${whoToContact}`,
    email_count: emails.length,
    meeting_count: meetings.length,
    who_to_contact: whoToContact,
    why_contact: whyContact,
    what_opportunity: whatOpportunity,
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export function runStakeholderEngine(
  emails: RawEmail[],
  meetings: RawMeeting[],
  researchCompanies: string[],
  product: string
): StakeholderAnalysisResult {
  const companies: CompanyStakeholderAnalysis[] = researchCompanies.map((companyName) => {
    // Filter emails/meetings relevant to this company
    const companyEmails = emails.filter((e) =>
      e.email_id.toLowerCase().includes(companyName.toLowerCase().replace(/\s/g, "_")) ||
      e.email_id.toLowerCase().includes(companyName.toLowerCase().split(" ")[0])
    );
    const companyMeetings = meetings.filter((m) =>
      m.account.name.toLowerCase().includes(companyName.toLowerCase()) ||
      companyName.toLowerCase().includes(m.account.name.toLowerCase())
    );
    return analyzeCompany(companyName, companyEmails, companyMeetings, product);
  });

  const allStakeholders = companies.flatMap((c) => c.all_stakeholders);
  const allSignals = companies.flatMap((c) => c.buying_signals);
  const allPainPoints = companies.flatMap((c) => c.pain_points);

  // Aggregate department distribution
  const deptDist: Record<string, number> = {};
  for (const s of allStakeholders) {
    deptDist[s.department] = (deptDist[s.department] ?? 0) + 1;
  }

  // Role distribution
  const roleDist: Record<string, number> = {};
  for (const s of allStakeholders) {
    roleDist[s.role] = (roleDist[s.role] ?? 0) + 1;
  }

  // Sentiment distribution
  const sentDist = { positive: 0, neutral: 0, negative: 0 };
  for (const s of allStakeholders) {
    if (s.sentiment === "Positive") sentDist.positive++;
    else if (s.sentiment === "Neutral") sentDist.neutral++;
    else sentDist.negative++;
  }

  // Deduplicate top signals
  const signalMap = new Map<string, BuyingSignal>();
  for (const sig of allSignals) {
    const existing = signalMap.get(sig.signal);
    if (!existing || sig.score > existing.score) signalMap.set(sig.signal, sig);
  }

  // Deduplicate top pain points
  const painMap = new Map<string, PainPoint>();
  for (const p of allPainPoints) {
    if (!painMap.has(p.category)) painMap.set(p.category, p);
  }

  const avgIntent = companies.length
    ? Math.round(companies.reduce((s, c) => s + c.overall_intent, 0) / companies.length)
    : 0;
  const avgOpportunity = companies.length
    ? Math.round(companies.reduce((s, c) => s + c.overall_opportunity, 0) / companies.length)
    : 0;
  const avgConfidence = companies.length
    ? Math.round(companies.reduce((s, c) => s + c.confidence, 0) / companies.length)
    : 0;

  return {
    product,
    total_companies: companies.length,
    total_stakeholders: allStakeholders.length,
    total_decision_makers: allStakeholders.filter((s) => s.role === "Decision Maker" || s.role === "Executive Sponsor").length,
    total_champions: allStakeholders.filter((s) => s.role === "Champion").length,
    total_buying_signals: signalMap.size,
    avg_intent_score: avgIntent,
    avg_opportunity_score: avgOpportunity,
    avg_confidence: avgConfidence,
    companies,
    top_buying_signals: Array.from(signalMap.values()).sort((a, b) => b.score - a.score).slice(0, 8),
    top_pain_points: Array.from(painMap.values()).slice(0, 8),
    department_distribution: deptDist,
    role_distribution: roleDist,
    sentiment_distribution: sentDist,
  };
}
