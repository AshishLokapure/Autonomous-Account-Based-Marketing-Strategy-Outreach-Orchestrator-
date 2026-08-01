-- AccountPilot AI: multi-tenant ABM platform schema for Supabase PostgreSQL.
-- Requires Supabase Auth; public.users extends auth.users with application metadata.

create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'sales_director', 'account_executive', 'marketing_manager', 'sales_representative');
create type public.subscription_plan as enum ('free', 'starter', 'professional', 'enterprise');
create type public.campaign_status as enum ('draft', 'active', 'paused', 'completed', 'archived');
create type public.crm_stage as enum ('target', 'discovery', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
create type public.account_priority as enum ('low', 'medium', 'high', 'critical');
create type public.stakeholder_type as enum ('champion', 'economic_buyer', 'decision_maker', 'influencer', 'technical_evaluator', 'blocker', 'end_user', 'unknown');
create type public.decision_level as enum ('executive', 'vp', 'director', 'manager', 'individual_contributor', 'unknown');
create type public.opportunity_status as enum ('open', 'won', 'lost', 'on_hold');
create type public.activity_type as enum ('call', 'email', 'meeting', 'note', 'task', 'linkedin', 'website_visit', 'other');
create type public.sentiment_type as enum ('positive', 'neutral', 'negative', 'mixed', 'unknown');
create type public.document_type as enum ('pdf', 'docx', 'pptx', 'xlsx', 'csv', 'email', 'transcript', 'webpage', 'other');
create type public.embedding_status as enum ('pending', 'processing', 'completed', 'failed');
create type public.severity_level as enum ('low', 'medium', 'high', 'critical');
create type public.outreach_status as enum ('draft', 'approved', 'sent', 'replied', 'archived');
create type public.agent_execution_status as enum ('queued', 'running', 'completed', 'failed', 'cancelled');
create type public.notification_type as enum ('account', 'signal', 'strategy', 'outreach', 'agent', 'system');

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = timezone('utc', now()); return new; end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (char_length(trim(company_name)) between 1 and 255),
  industry text,
  website text check (website is null or website ~* '^https?://'),
  company_size text,
  country text,
  subscription_plan public.subscription_plan not null default 'free',
  logo_url text check (logo_url is null or logo_url ~* '^https?://'),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 255),
  email text not null unique check (email = lower(email) and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  password_hash text, -- only for non-Supabase identity providers; never expose through the API.
  avatar_url text check (avatar_url is null or avatar_url ~* '^https?://'),
  role public.user_role not null default 'sales_representative',
  department text,
  job_title text,
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Security-definer helper prevents RLS recursion while resolving the active tenant.
create or replace function public.current_organization_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.users where id = auth.uid()
$$;

create table public.campaigns (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_name text not null check (char_length(trim(campaign_name)) between 1 and 255), campaign_goal text, product_name text,
  description text, status public.campaign_status not null default 'draft', budget numeric(14,2) check (budget is null or budget >= 0),
  target_industries text[] not null default '{}', target_countries text[] not null default '{}', target_company_size text,
  start_date date, end_date date, created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null, company_name text not null check (char_length(trim(company_name)) between 1 and 255),
  website text check (website is null or website ~* '^https?://'), industry text, headquarters text,
  employee_count integer check (employee_count is null or employee_count >= 0), annual_revenue numeric(18,2) check (annual_revenue is null or annual_revenue >= 0),
  crm_stage public.crm_stage not null default 'target', priority public.account_priority not null default 'medium',
  health_score smallint check (health_score between 0 and 100), relationship_score smallint check (relationship_score between 0 and 100), notes text,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, company_name)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  first_name text not null, last_name text not null, designation text, department text, email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text, linkedin_url text check (linkedin_url is null or linkedin_url ~* '^https?://'), stakeholder_type public.stakeholder_type not null default 'unknown',
  decision_level public.decision_level not null default 'unknown', influence_score smallint check (influence_score between 0 and 100), relationship_score smallint check (relationship_score between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), unique (account_id, email)
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  opportunity_name text not null, deal_value numeric(18,2) check (deal_value is null or deal_value >= 0), stage public.crm_stage not null default 'discovery',
  probability smallint not null default 0 check (probability between 0 and 100), expected_close_date date, status public.opportunity_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.activities (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null, activity_type public.activity_type not null, title text not null, description text,
  activity_date timestamptz not null default timezone('utc', now()), created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.emails (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  sender text not null check (sender ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'), receiver text not null check (receiver ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text, body text, sentiment public.sentiment_type not null default 'unknown', sent_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  title text not null, meeting_date timestamptz not null, duration_minutes integer check (duration_minutes is null or duration_minutes > 0), organizer text,
  meeting_summary text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.meeting_transcripts (
  id uuid primary key default gen_random_uuid(), meeting_id uuid not null unique references public.meetings(id) on delete cascade,
  transcript text not null, speaker_count integer check (speaker_count is null or speaker_count >= 0), sentiment public.sentiment_type not null default 'unknown',
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.documents (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  document_name text not null, document_type public.document_type not null, file_url text not null check (file_url ~* '^https?://'),
  file_size bigint check (file_size is null or file_size >= 0), uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0), chunk_text text not null, metadata jsonb not null default '{}'::jsonb,
  embedding_status public.embedding_status not null default 'pending', created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  unique (document_id, chunk_index), check (jsonb_typeof(metadata) = 'object')
);

create table public.company_research (
  id uuid primary key default gen_random_uuid(), account_id uuid not null unique references public.accounts(id) on delete cascade,
  business_summary text, technologies jsonb not null default '[]'::jsonb, competitors jsonb not null default '[]'::jsonb, leadership jsonb not null default '[]'::jsonb,
  funding jsonb not null default '{}'::jsonb, hiring_trends jsonb not null default '{}'::jsonb, latest_news jsonb not null default '[]'::jsonb, ai_initiatives jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.buying_signals (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  signal text not null, confidence_score smallint not null check (confidence_score between 0 and 100), source text not null, evidence text not null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.pain_points (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  pain_point text not null, severity public.severity_level not null default 'medium', evidence text not null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.strategies (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  executive_summary text not null, recommended_pitch text, competitive_positioning text, whitespace_opportunities jsonb not null default '[]'::jsonb,
  recommended_channel text, next_best_action text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.outreach (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  email_content text, linkedin_message text, call_script text, meeting_agenda text, status public.outreach_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  check (email_content is not null or linkedin_message is not null or call_script is not null or meeting_agenda is not null)
);

create table public.ai_agent_logs (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id) on delete cascade,
  agent_name text not null, execution_status public.agent_execution_status not null default 'queued', execution_time_ms integer check (execution_time_ms is null or execution_time_ms >= 0),
  input_json jsonb not null default '{}'::jsonb, output_json jsonb, created_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(input_json) = 'object'), check (output_json is null or jsonb_typeof(output_json) = 'object')
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade, title text not null, message text not null, notification_type public.notification_type not null,
  is_read boolean not null default false, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

-- Operational indexes: all foreign keys and high-frequency filtering paths are indexed.
create index users_organization_id_idx on public.users (organization_id);
create index campaigns_organization_status_idx on public.campaigns (organization_id, status);
create index accounts_organization_priority_idx on public.accounts (organization_id, priority, health_score desc nulls last);
create index accounts_campaign_id_idx on public.accounts (campaign_id);
create index contacts_account_id_idx on public.contacts (account_id);
create index contacts_account_stakeholder_idx on public.contacts (account_id, stakeholder_type, decision_level);
create index opportunities_account_status_idx on public.opportunities (account_id, status, expected_close_date);
create index activities_account_date_idx on public.activities (account_id, activity_date desc);
create index emails_account_sent_at_idx on public.emails (account_id, sent_at desc);
create index meetings_account_date_idx on public.meetings (account_id, meeting_date desc);
create index documents_account_id_idx on public.documents (account_id);
create index document_chunks_document_id_idx on public.document_chunks (document_id, chunk_index);
create index buying_signals_account_confidence_idx on public.buying_signals (account_id, confidence_score desc);
create index pain_points_account_severity_idx on public.pain_points (account_id, severity);
create index strategies_account_id_idx on public.strategies (account_id, created_at desc);
create index outreach_account_status_idx on public.outreach (account_id, status, created_at desc);
create index ai_agent_logs_account_status_idx on public.ai_agent_logs (account_id, execution_status, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id, is_read, created_at desc);
create index company_research_technologies_gin_idx on public.company_research using gin (technologies);
create index document_chunks_metadata_gin_idx on public.document_chunks using gin (metadata);

-- Keep mutable rows current without application-side timestamp bookkeeping.
do $$ declare table_name text; begin
  foreach table_name in array array['organizations','users','campaigns','accounts','contacts','opportunities','activities','emails','meetings','meeting_transcripts','documents','document_chunks','company_research','buying_signals','pain_points','strategies','outreach','notifications']
  loop execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_name || '_set_updated_at', table_name); end loop;
end $$;

comment on schema public is 'AccountPilot AI application schema. Every customer-owned row is protected by organization RLS.';
comment on table public.organizations is 'Tenant root for an AccountPilot customer workspace.';
comment on table public.users is 'Application user profile linked one-to-one to Supabase Auth identity.';
comment on table public.document_chunks is 'Retrieval-ready document sections. Embeddings belong in Qdrant; metadata retains source linkage.';
comment on table public.ai_agent_logs is 'Auditable execution records for AccountPilot multi-agent workflows.';
comment on column public.buying_signals.evidence is 'Human-readable source-backed evidence. Do not store unsupported generated claims.';

-- Supabase Row Level Security: all data is scoped to the caller's organization.
alter table public.organizations enable row level security; alter table public.users enable row level security;
alter table public.campaigns enable row level security; alter table public.accounts enable row level security; alter table public.contacts enable row level security;
alter table public.opportunities enable row level security; alter table public.activities enable row level security; alter table public.emails enable row level security;
alter table public.meetings enable row level security; alter table public.meeting_transcripts enable row level security; alter table public.documents enable row level security;
alter table public.document_chunks enable row level security; alter table public.company_research enable row level security; alter table public.buying_signals enable row level security;
alter table public.pain_points enable row level security; alter table public.strategies enable row level security; alter table public.outreach enable row level security;
alter table public.ai_agent_logs enable row level security; alter table public.notifications enable row level security;

create policy organization_tenant_access on public.organizations for all using (id = public.current_organization_id()) with check (id = public.current_organization_id());
create policy users_tenant_access on public.users for all using (organization_id = public.current_organization_id()) with check (organization_id = public.current_organization_id());
create policy campaigns_tenant_access on public.campaigns for all using (organization_id = public.current_organization_id()) with check (organization_id = public.current_organization_id());
create policy accounts_tenant_access on public.accounts for all using (organization_id = public.current_organization_id()) with check (organization_id = public.current_organization_id());
create policy notifications_tenant_access on public.notifications for all using (organization_id = public.current_organization_id()) with check (organization_id = public.current_organization_id());

create policy contacts_tenant_access on public.contacts for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy opportunities_tenant_access on public.opportunities for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy activities_tenant_access on public.activities for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy emails_tenant_access on public.emails for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy meetings_tenant_access on public.meetings for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy documents_tenant_access on public.documents for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy research_tenant_access on public.company_research for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy signals_tenant_access on public.buying_signals for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy pain_points_tenant_access on public.pain_points for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy strategies_tenant_access on public.strategies for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy outreach_tenant_access on public.outreach for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy agent_logs_tenant_access on public.ai_agent_logs for all using (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.accounts a where a.id = account_id and a.organization_id = public.current_organization_id()));
create policy transcript_tenant_access on public.meeting_transcripts for all using (exists (select 1 from public.meetings m join public.accounts a on a.id = m.account_id where m.id = meeting_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.meetings m join public.accounts a on a.id = m.account_id where m.id = meeting_id and a.organization_id = public.current_organization_id()));
create policy chunks_tenant_access on public.document_chunks for all using (exists (select 1 from public.documents d join public.accounts a on a.id = d.account_id where d.id = document_id and a.organization_id = public.current_organization_id())) with check (exists (select 1 from public.documents d join public.accounts a on a.id = d.account_id where d.id = document_id and a.organization_id = public.current_organization_id()));
