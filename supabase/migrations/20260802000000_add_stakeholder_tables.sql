create table if not exists public.stakeholder_intel (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  company text not null,
  product text not null,
  who_to_contact text,
  why_contact text,
  what_problems text[],
  who_approves text,
  who_influences text,
  who_blocks text,
  what_opportunity text,
  raw_llm_response text,
  updated_at timestamptz default now(),
  unique (run_id, company)
);

create table if not exists public.stakeholder_people (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  company text not null,
  product text not null,
  name text not null,
  email text not null,
  role text,
  influence_score integer check (influence_score between 0 and 100),
  source text check (source in ('email', 'meeting', 'both')),
  topics_mentioned text[],
  sentiment text check (sentiment in ('Positive', 'Neutral', 'Negative')),
  approves_purchases boolean default false,
  influences_decisions boolean default false,
  is_blocking boolean default false,
  updated_at timestamptz default now(),
  unique (run_id, company, email)
);

create index if not exists idx_stakeholder_intel_run on public.stakeholder_intel (run_id);
create index if not exists idx_stakeholder_intel_company on public.stakeholder_intel (company);
create index if not exists idx_stakeholder_people_run on public.stakeholder_people (run_id);
create index if not exists idx_stakeholder_people_company on public.stakeholder_people (company);

alter table public.stakeholder_intel enable row level security;
alter table public.stakeholder_people enable row level security;

drop policy if exists allow_all_stakeholder_intel on public.stakeholder_intel;
drop policy if exists allow_all_stakeholder_people on public.stakeholder_people;

create policy allow_all_stakeholder_intel
on public.stakeholder_intel
for all
using (true)
with check (true);

create policy allow_all_stakeholder_people
on public.stakeholder_people
for all
using (true)
with check (true);
