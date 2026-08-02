-- ─── Stakeholder Intel Table ──────────────────────────────────────────────────
-- One row per company per campaign run
-- Stores LLM answers to the 7 key sales intelligence questions

create table if not exists stakeholder_intel (
  id            uuid primary key default gen_random_uuid(),
  run_id        text not null,
  company       text not null,
  product       text not null,

  -- 7 key sales intelligence questions answered by Groq LLM
  who_to_contact    text,
  why_contact       text,
  what_problems     text[],
  who_approves      text,
  who_influences    text,
  who_blocks        text,
  what_opportunity  text,

  raw_llm_response  text,
  updated_at        timestamptz default now(),

  unique (run_id, company)
);

-- ─── Stakeholder People Table ─────────────────────────────────────────────────
-- One row per person per company per campaign run
-- Stores name, email, role, influence extracted from emails + meeting transcripts

create table if not exists stakeholder_people (
  id                  uuid primary key default gen_random_uuid(),
  run_id              text not null,
  company             text not null,
  product             text not null,

  -- Person data extracted from mail logs + meeting transcripts
  name                text not null,
  email               text not null,
  role                text,
  influence_score     integer check (influence_score between 0 and 100),
  source              text check (source in ('email', 'meeting', 'both')),
  topics_mentioned    text[],
  sentiment           text check (sentiment in ('Positive', 'Neutral', 'Negative')),

  -- Decision flags
  approves_purchases  boolean default false,
  influences_decisions boolean default false,
  is_blocking         boolean default false,

  updated_at          timestamptz default now(),

  unique (run_id, company, email)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_stakeholder_intel_run    on stakeholder_intel (run_id);
create index if not exists idx_stakeholder_intel_company on stakeholder_intel (company);
create index if not exists idx_stakeholder_people_run   on stakeholder_people (run_id);
create index if not exists idx_stakeholder_people_company on stakeholder_people (company);

-- ─── RLS (allow anon read/write for demo) ─────────────────────────────────────
alter table stakeholder_intel   enable row level security;
alter table stakeholder_people  enable row level security;

create policy "allow_all_stakeholder_intel"  on stakeholder_intel  for all using (true) with check (true);
create policy "allow_all_stakeholder_people" on stakeholder_people for all using (true) with check (true);
