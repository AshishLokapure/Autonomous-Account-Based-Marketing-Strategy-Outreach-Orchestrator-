-- Migration: 20260803000000_add_email_drafts_and_logs.sql
-- Description: Creates email_drafts, user_settings, and email_logs tables with appropriate indexes and RLS policies.

-- 1. Create email_drafts table
create table if not exists public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  campaign_id text,
  product text not null,
  company text not null,
  decision_maker text,
  recipient_email text,
  subject text,
  body text,
  intent_score integer,
  generated_by text,
  status text not null default 'draft',
  cta text,
  confidence integer default 92,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  sent_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_email_drafts_product on public.email_drafts (product);
create index if not exists idx_email_drafts_company on public.email_drafts (company);
create index if not exists idx_email_drafts_campaign on public.email_drafts (campaign_id);
create index if not exists idx_email_drafts_status on public.email_drafts (status);
create index if not exists idx_email_drafts_created_at on public.email_drafts (created_at desc);

alter table public.email_drafts enable row level security;
create policy allow_all_email_drafts on public.email_drafts for all using (true) with check (true);


-- 2. Create user_settings table
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,

  -- Profile
  full_name text,
  company_name text,
  designation text,
  phone_number text,
  profile_picture_url text,

  -- Campaign Automation
  auto_send_email boolean default false,

  -- Email Preferences
  sender_name text,
  reply_email text,
  timezone text default 'UTC',
  daily_limit integer default 100,
  delay_between_emails integer default 5,
  email_signature text,

  -- AI Preferences
  llm_model text default 'llama-3.3-70b-versatile',
  temperature float default 0.7,
  writing_style text default 'Professional',
  tone_tags text[] default array['Professional', 'Direct'],
  email_length text default 'Medium',

  -- Notification Settings
  notify_email_opened boolean default true,
  notify_campaign_complete boolean default true,
  notify_agent_failure boolean default true,
  weekly_report boolean default true,
  daily_summary boolean default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_settings_user_id on public.user_settings (user_id);

alter table public.user_settings enable row level security;
create policy allow_all_user_settings on public.user_settings for all using (true) with check (true);


-- 3. Create email_logs table
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  draft_id text,
  recipient_email text not null,
  subject text not null,
  company text,
  product text,
  status text not null default 'sent',
  opened_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_logs_user_id on public.email_logs (user_id);
create index if not exists idx_email_logs_created_at on public.email_logs (created_at desc);

alter table public.email_logs enable row level security;
create policy allow_all_email_logs on public.email_logs for all using (true) with check (true);
