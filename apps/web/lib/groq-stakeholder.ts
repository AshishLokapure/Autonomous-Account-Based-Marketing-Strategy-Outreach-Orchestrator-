/**
 * Groq Stakeholder Intelligence
 * Uses Groq LLM (llama-3.3-70b-versatile) to answer the 7 key sales questions
 * per company from raw email + transcript context.
 */

import { RawEmail, RawMeeting } from "./stakeholder-engine";

export interface GroqStakeholderIntel {
  company: string;
  product: string;
  // The 7 key questions answered by LLM
  who_to_contact: string;
  why_contact: string;
  what_problems: string[];
  who_approves: string;
  who_influences: string;
  who_blocks: string;
  what_opportunity: string;
  // Per-person data extracted by LLM
  people: GroqPersonProfile[];
  raw_llm_response: string;
}

export interface GroqPersonProfile {
  name: string;
  email: string;
  role: string;
  influence_score: number; // 0-100, LLM estimated
  source: "email" | "meeting" | "both";
  topics_mentioned: string[];
  sentiment: "Positive" | "Neutral" | "Negative";
  approves_purchases: boolean;
  influences_decisions: boolean;
  is_blocking: boolean;
}

function buildContext(
  company: string,
  emails: RawEmail[],
  meetings: RawMeeting[],
  product: string
): string {
  const emailContext = emails
    .map(
      (e) =>
        `EMAIL [${e.timestamp}]\nFrom: ${e.from_person_id}\nSubject: ${e.subject}\nBody: ${e.body}\nTopics: ${e.mentioned_topics.join(", ")}`
    )
    .join("\n\n");

  const meetingContext = meetings
    .map((m) => {
      const participants = m.participants
        .filter((p) => p.type === "prospect")
        .map((p) => `${p.name} (${p.role}, ${p.email ?? "no email"})`)
        .join(", ");
      const transcript = m.content.transcript
        .map((t) => `${t.speaker}: ${t.text}`)
        .join("\n");
      return `MEETING [${m.timestamp}] — ${m.content.title}\nParticipants: ${participants}\nTranscript:\n${transcript}\nAction Items: ${m.metadata.action_items.join(", ")}`;
    })
    .join("\n\n");

  return `COMPANY: ${company}\nPRODUCT BEING SOLD: ${product}\n\n--- EMAILS ---\n${emailContext || "No emails."}\n\n--- MEETING TRANSCRIPTS ---\n${meetingContext || "No meetings."}`;
}

function buildPrompt(context: string): string {
  return `You are an expert B2B sales intelligence analyst. Analyze the following communication data and answer exactly in the JSON format below. Be specific, use real names from the data.

${context}

Respond ONLY with valid JSON matching this exact structure:
{
  "who_to_contact": "Full name and title of the single best person to contact first, and why they are the priority",
  "why_contact": "Specific reason based on their communications — what they said, what they need",
  "what_problems": ["problem 1", "problem 2", "problem 3"],
  "who_approves": "Name and title of person who approves purchases/budget. If unknown, say 'Not identified — likely Finance/CFO level'",
  "who_influences": "Names and roles of people who influence the decision without final authority",
  "who_blocks": "Name and role of anyone showing resistance, compliance concerns, or blocking signals. If none, say 'No blockers identified'",
  "what_opportunity": "Specific opportunity: what product/service fits, estimated deal size category (small/mid/enterprise), urgency level, and why now",
  "people": [
    {
      "name": "Full Name",
      "email": "email@company.com",
      "role": "Their job title",
      "influence_score": 85,
      "source": "meeting",
      "topics_mentioned": ["topic1", "topic2"],
      "sentiment": "Positive",
      "approves_purchases": false,
      "influences_decisions": true,
      "is_blocking": false
    }
  ]
}`;
}

export async function runGroqStakeholderIntel(
  company: string,
  emails: RawEmail[],
  meetings: RawMeeting[],
  product: string
): Promise<GroqStakeholderIntel> {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!apiKey || apiKey === "GROQ_API_KEY") {
    console.warn(`[Groq] No API key — falling back to keyword engine for ${company}`);
    return buildFallback(company, product, emails, meetings);
  }

  const context = buildContext(company, emails, meetings, product);
  const prompt = buildPrompt(context);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[Groq] API error for ${company}:`, err);
      return buildFallback(company, product, emails, meetings);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    return {
      company,
      product,
      who_to_contact: parsed.who_to_contact ?? "Not identified",
      why_contact: parsed.why_contact ?? "Insufficient data",
      what_problems: Array.isArray(parsed.what_problems) ? parsed.what_problems : [],
      who_approves: parsed.who_approves ?? "Not identified",
      who_influences: parsed.who_influences ?? "Not identified",
      who_blocks: parsed.who_blocks ?? "No blockers identified",
      what_opportunity: parsed.what_opportunity ?? "Opportunity not assessed",
      people: Array.isArray(parsed.people) ? parsed.people : [],
      raw_llm_response: raw,
    };
  } catch (err) {
    console.error(`[Groq] Parse error for ${company}:`, err);
    return buildFallback(company, product, emails, meetings);
  }
}

// ─── Fallback (keyword engine) when no API key ────────────────────────────────

function buildFallback(
  company: string,
  product: string,
  emails: RawEmail[],
  meetings: RawMeeting[]
): GroqStakeholderIntel {
  const prospects = meetings.flatMap((m) =>
    m.participants.filter((p) => p.type === "prospect")
  );
  const uniquePeople = Array.from(
    new Map(prospects.map((p) => [p.name, p])).values()
  );

  const allText = [
    ...emails.map((e) => `${e.subject} ${e.body}`),
    ...meetings.flatMap((m) => m.content.transcript.map((t) => t.text)),
  ]
    .join(" ")
    .toLowerCase();

  const problems: string[] = [];
  if (allText.includes("security") || allText.includes("compliance")) problems.push("Security & Compliance requirements");
  if (allText.includes("cost") || allText.includes("budget")) problems.push("Budget & Cost optimization");
  if (allText.includes("migration") || allText.includes("legacy")) problems.push("Legacy system migration");
  if (allText.includes("governance")) problems.push("Governance & policy controls");
  if (allText.includes("kubernetes") || allText.includes("container")) problems.push("Container modernization");
  if (problems.length === 0) problems.push("Cloud modernization", "AI adoption");

  const topPerson = uniquePeople[0];
  const isDecisionMaker = (role: string) =>
    /head|vp|director|chief|cto|cio|ceo/i.test(role);
  const isBudget = (role: string) => /finance|cfo|budget|procurement/i.test(role);
  const isBlocker = (role: string) => /legal|compliance|security|risk/i.test(role);

  const people: GroqPersonProfile[] = uniquePeople.map((p) => ({
    name: p.name,
    email: p.email ?? `${p.name.toLowerCase().replace(/\s/g, ".")}@${company.toLowerCase().replace(/\s/g, "")}.com`,
    role: p.role,
    influence_score: isDecisionMaker(p.role) ? 88 : isBudget(p.role) ? 82 : 70,
    source: "both" as const,
    topics_mentioned: meetings.flatMap((m) => m.metadata.mentioned_topics).slice(0, 4),
    sentiment: "Positive" as const,
    approves_purchases: isDecisionMaker(p.role) || isBudget(p.role),
    influences_decisions: isDecisionMaker(p.role) || !isBlocker(p.role),
    is_blocking: isBlocker(p.role),
  }));

  const decisionMaker = uniquePeople.find((p) => isDecisionMaker(p.role)) ?? topPerson;
  const blocker = uniquePeople.find((p) => isBlocker(p.role));

  return {
    company,
    product,
    who_to_contact: decisionMaker
      ? `${decisionMaker.name} — ${decisionMaker.role}`
      : "Not identified from available data",
    why_contact: decisionMaker
      ? `${decisionMaker.name} is the senior decision maker at ${company} and has been actively engaged in ${product} evaluation discussions.`
      : "No clear decision maker identified yet.",
    what_problems: problems,
    who_approves: uniquePeople.find((p) => isBudget(p.role))?.name
      ? `${uniquePeople.find((p) => isBudget(p.role))!.name} — ${uniquePeople.find((p) => isBudget(p.role))!.role}`
      : "Not identified — likely Finance/CFO level",
    who_influences: uniquePeople
      .filter((p) => !isDecisionMaker(p.role) && !isBlocker(p.role))
      .map((p) => `${p.name} (${p.role})`)
      .join(", ") || "Not identified",
    who_blocks: blocker
      ? `${blocker.name} — ${blocker.role} — may raise compliance/security objections`
      : "No blockers identified",
    what_opportunity: `${company} is actively evaluating ${product}. ${emails.length} emails and ${meetings.length} meetings recorded. ${problems.length} pain points detected. Enterprise-level opportunity.`,
    people,
    raw_llm_response: "fallback",
  };
}
