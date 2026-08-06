-- AccountPilot AI Settings Module Migrations

-- 1. Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile
    full_name TEXT,
    company_name TEXT,
    designation TEXT,
    phone_number TEXT,
    profile_picture_url TEXT,
    
    -- Campaign Automation
    auto_send_email BOOLEAN DEFAULT false,
    
    -- Email Preferences
    sender_name TEXT,
    reply_email TEXT,
    timezone TEXT DEFAULT 'UTC',
    daily_limit INTEGER DEFAULT 100,
    delay_between_emails INTEGER DEFAULT 5,
    email_signature TEXT,
    
    -- AI Preferences
    llm_model TEXT DEFAULT 'llama-3.3-70b-versatile',
    temperature FLOAT DEFAULT 0.7,
    writing_style TEXT DEFAULT 'Professional',
    tone_tags TEXT[] DEFAULT ARRAY['Professional', 'Direct'],
    email_length TEXT DEFAULT 'Medium',
    
    -- Notification Settings
    notify_email_opened BOOLEAN DEFAULT true,
    notify_campaign_complete BOOLEAN DEFAULT true,
    notify_agent_failure BOOLEAN DEFAULT true,
    weekly_report BOOLEAN DEFAULT true,
    daily_summary BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
ON public.user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON public.user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON public.user_settings FOR UPDATE
USING (auth.uid() = user_id);


-- 2. Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent', -- sent, failed, bounced, opened
    opened_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs"
ON public.email_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email logs"
ON public.email_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);
