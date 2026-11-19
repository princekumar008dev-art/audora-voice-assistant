-- ========================================================
-- Echo Voice Assistant - Supabase Database Schema
-- Run this script in your Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: echo_conversations
-- Stores voice command history and AI responses
CREATE TABLE IF NOT EXISTS echo_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT DEFAULT 'guest_user',
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    action_type TEXT DEFAULT 'chat', -- 'chat', 'note', 'reminder', 'weather', 'media', 'system'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for echo_conversations
ALTER TABLE echo_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on conversations"
    ON echo_conversations FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on conversations"
    ON echo_conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public delete on conversations"
    ON echo_conversations FOR DELETE
    USING (true);


-- 2. Table: echo_notes
-- Stores voice notes taken through the assistant ("Take a note...")
CREATE TABLE IF NOT EXISTS echo_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT DEFAULT 'guest_user',
    title TEXT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for echo_notes
ALTER TABLE echo_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on notes"
    ON echo_notes FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on notes"
    ON echo_notes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on notes"
    ON echo_notes FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on notes"
    ON echo_notes FOR DELETE
    USING (true);


-- 3. Table: echo_reminders
-- Stores reminders & timers set by voice ("Remind me to...")
CREATE TABLE IF NOT EXISTS echo_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT DEFAULT 'guest_user',
    title TEXT NOT NULL,
    due_time TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for echo_reminders
ALTER TABLE echo_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on reminders"
    ON echo_reminders FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on reminders"
    ON echo_reminders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on reminders"
    ON echo_reminders FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on reminders"
    ON echo_reminders FOR DELETE
    USING (true);

-- Indexing for fast queries
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON echo_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON echo_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_created_at ON echo_reminders(created_at DESC);
