-- ==============================================================================
-- DATABASE SCHEMA: LINE Inbound Webhook Events & Realtime Chat
-- Migration 06: LINE Inbound Events Table & Public Permissions
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.line_inbound_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001'::uuid,
    line_user_id TEXT NOT NULL,
    line_display_name TEXT DEFAULT 'ผู้ใช้ LINE',
    picture_url TEXT,
    message_type TEXT DEFAULT 'text', -- text, datetimepicker, postback, sticker, image
    text_content TEXT,
    event_data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and grant open access
ALTER TABLE public.line_inbound_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public line_inbound_events full access" ON public.line_inbound_events;
CREATE POLICY "Public line_inbound_events full access"
    ON public.line_inbound_events
    FOR ALL
    TO public, anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Enable Supabase Realtime for line_inbound_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.line_inbound_events;

-- Create index for fast chatter queries
CREATE INDEX IF NOT EXISTS idx_line_inbound_events_user ON public.line_inbound_events(line_user_id, created_at DESC);
