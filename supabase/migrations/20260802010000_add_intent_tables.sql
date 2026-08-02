create table if not exists public.intent_analysis (
  id uuid primary key default gen_random_uuid(),
  campaign_id text,
  product text not null,
  company text not null,
  intent_score integer not null check (intent_score between 0 and 100),
  intent_level text not null,
  purchase_probability integer not null check (purchase_probability between 0 and 100),
  confidence integer not null check (confidence between 0 and 100),
  buying_stage text not null,
  purchase_window text not null,
  recommended_action text,
  recommended_priority text,
  explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.intent_scores (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.intent_analysis(id) on delete cascade,
  score_key text not null,
  score_value numeric(10,2) not null,
  created_at timestamptz not null default now(),
  unique (analysis_id, score_key)
);

create table if not exists public.intent_signals (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.intent_analysis(id) on delete cascade,
  signal text not null,
  signal_type text not null check (signal_type in ('positive', 'negative')),
  weight integer not null,
  source text not null,
  confidence integer not null check (confidence between 0 and 100),
  evidence text,
  occurrences integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.intent_keyword_matches (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.intent_analysis(id) on delete cascade,
  keyword text not null,
  category text not null,
  occurrences integer not null default 1,
  sources text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.intent_recommendations (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.intent_analysis(id) on delete cascade,
  recommended_action text not null,
  recommended_priority text not null,
  executive_involvement jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (analysis_id)
);

create index if not exists idx_intent_analysis_campaign on public.intent_analysis (campaign_id);
create index if not exists idx_intent_analysis_company on public.intent_analysis (company);
create index if not exists idx_intent_signals_analysis on public.intent_signals (analysis_id);
create index if not exists idx_intent_keyword_matches_analysis on public.intent_keyword_matches (analysis_id);
create index if not exists idx_intent_scores_analysis on public.intent_scores (analysis_id);

alter table public.intent_analysis enable row level security;
alter table public.intent_scores enable row level security;
alter table public.intent_signals enable row level security;
alter table public.intent_keyword_matches enable row level security;
alter table public.intent_recommendations enable row level security;

create policy allow_all_intent_analysis on public.intent_analysis for all using (true) with check (true);
create policy allow_all_intent_scores on public.intent_scores for all using (true) with check (true);
create policy allow_all_intent_signals on public.intent_signals for all using (true) with check (true);
create policy allow_all_intent_keyword_matches on public.intent_keyword_matches for all using (true) with check (true);
create policy allow_all_intent_recommendations on public.intent_recommendations for all using (true) with check (true);

