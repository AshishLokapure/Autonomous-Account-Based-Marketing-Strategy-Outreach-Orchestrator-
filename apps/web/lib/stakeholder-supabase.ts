/**
 * Stakeholder Supabase persistence.
 * Saves generated stakeholder intel and per-person profiles.
 */

import { createClient } from "./supabase";
import { GroqPersonProfile, GroqStakeholderIntel } from "./groq-stakeholder";

export async function saveStakeholderIntel(
  intel: GroqStakeholderIntel,
  runId: string
): Promise<void> {
  const supabase = createClient();

  if (!supabase) {
    return;
  }

  const { error: intelError } = await supabase
    .from("stakeholder_intel")
    .upsert(
      {
        run_id: runId,
        company: intel.company,
        product: intel.product,
        who_to_contact: intel.who_to_contact,
        why_contact: intel.why_contact,
        what_problems: intel.what_problems,
        who_approves: intel.who_approves,
        who_influences: intel.who_influences,
        who_blocks: intel.who_blocks,
        what_opportunity: intel.what_opportunity,
        raw_llm_response: intel.raw_llm_response,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "run_id,company" }
    );

  if (intelError) {
    console.warn(`[Supabase] stakeholder_intel unavailable for ${intel.company}:`, intelError.message);
  }

  if (intel.people.length === 0) {
    return;
  }

  const rows = intel.people.map((person) =>
    buildPersonRow(person, intel.company, intel.product, runId)
  );

  const { error: peopleError } = await supabase
    .from("stakeholder_people")
    .upsert(rows, { onConflict: "run_id,company,email" });

  if (peopleError) {
    console.warn(`[Supabase] stakeholder_people unavailable for ${intel.company}:`, peopleError.message);
  }
}

export async function saveAllStakeholderIntel(
  intelList: GroqStakeholderIntel[],
  runId: string
): Promise<void> {
  await Promise.all(intelList.map((intel) => saveStakeholderIntel(intel, runId)));
  console.log(`[Supabase] Saved stakeholder intel for ${intelList.length} companies. Run: ${runId}`);
}

export async function fetchStakeholderIntel(runId: string): Promise<GroqStakeholderIntel[]> {
  const supabase = createClient();

  if (!supabase) {
    return [];
  }

  const { data: intelRows, error: intelError } = await supabase
    .from("stakeholder_intel")
    .select("*")
    .eq("run_id", runId);

  if (intelError || !intelRows) {
    console.warn("[Supabase] fetchStakeholderIntel unavailable:", intelError?.message);
    return [];
  }

  const { data: peopleRows, error: peopleError } = await supabase
    .from("stakeholder_people")
    .select("*")
    .eq("run_id", runId);

  if (peopleError) {
    console.warn("[Supabase] stakeholder_people fetch skipped:", peopleError.message);
  }

  return intelRows.map((row: Record<string, any>) => ({
    company: row.company,
    product: row.product,
    who_to_contact: row.who_to_contact,
    why_contact: row.why_contact,
    what_problems: row.what_problems ?? [],
    who_approves: row.who_approves,
    who_influences: row.who_influences,
    who_blocks: row.who_blocks,
    what_opportunity: row.what_opportunity,
    raw_llm_response: row.raw_llm_response,
    people: (peopleRows ?? [])
      .filter((person: Record<string, any>) => person.company === row.company)
      .map(rowToPersonProfile),
  }));
}

function buildPersonRow(
  person: GroqPersonProfile,
  company: string,
  product: string,
  runId: string
) {
  return {
    run_id: runId,
    company,
    product,
    name: person.name,
    email: person.email,
    role: person.role,
    influence_score: person.influence_score,
    source: person.source,
    topics_mentioned: person.topics_mentioned,
    sentiment: person.sentiment,
    approves_purchases: person.approves_purchases,
    influences_decisions: person.influences_decisions,
    is_blocking: person.is_blocking,
    updated_at: new Date().toISOString(),
  };
}

function rowToPersonProfile(row: Record<string, unknown>): GroqPersonProfile {
  return {
    name: row.name as string,
    email: row.email as string,
    role: row.role as string,
    influence_score: row.influence_score as number,
    source: row.source as "email" | "meeting" | "both",
    topics_mentioned: (row.topics_mentioned as string[]) ?? [],
    sentiment: row.sentiment as "Positive" | "Neutral" | "Negative",
    approves_purchases: row.approves_purchases as boolean,
    influences_decisions: row.influences_decisions as boolean,
    is_blocking: row.is_blocking as boolean,
  };
}
