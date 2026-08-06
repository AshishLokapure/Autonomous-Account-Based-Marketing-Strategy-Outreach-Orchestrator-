-- ==========================================================
-- AccountPilot AI: email_drafts Table Migration for Supabase
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.email_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL,
    company TEXT NOT NULL,
    product TEXT NOT NULL,
    decision_maker TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    intent_score INTEGER DEFAULT 0,
    generated_by TEXT DEFAULT 'Grok-2 / Outreach Agent',
    status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, sending, sent, failed, opened, clicked, replied
    cta TEXT,
    confidence INTEGER DEFAULT 90,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- buying_signals, pain_points, meeting_summary, research_summary
    sent_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for fast retrieval
CREATE INDEX IF NOT EXISTS idx_email_drafts_campaign_id ON public.email_drafts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_company ON public.email_drafts(company);
CREATE INDEX IF NOT EXISTS idx_email_drafts_product ON public.email_drafts(product);
CREATE INDEX IF NOT EXISTS idx_email_drafts_status ON public.email_drafts(status);
CREATE INDEX IF NOT EXISTS idx_email_drafts_created_at ON public.email_drafts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

-- Allow public access with anon key for demo / platform operations
CREATE POLICY "Allow public select on email_drafts"
ON public.email_drafts FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on email_drafts"
ON public.email_drafts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on email_drafts"
ON public.email_drafts FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on email_drafts"
ON public.email_drafts FOR DELETE
USING (true);
