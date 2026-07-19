-- CarrierGuard AI - Documents & COI Verification Schema
-- Run this in your Supabase SQL Editor

-- 1. Documents table (uploaded COIs, certificates, etc.)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    carrier_check_id UUID REFERENCES carrier_checks(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL DEFAULT 'coi',
    status TEXT DEFAULT 'pending',
    verification_status TEXT DEFAULT 'unverified',
    risk_score NUMERIC(5,2) DEFAULT 0,
    carrier_name TEXT,
    dot_number TEXT,
    mc_number TEXT,
    insurer_name TEXT,
    policy_number TEXT,
    policy_type TEXT,
    coverage_amount TEXT,
    effective_date TEXT,
    expiration_date TEXT,
    ai_analysis TEXT,
    flags JSONB DEFAULT '[]',
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_carrier_check_id ON documents(carrier_check_id);
CREATE INDEX IF NOT EXISTS idx_documents_dot_number ON documents(dot_number);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- 2. RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated backend" ON documents;
CREATE POLICY "Allow all for authenticated backend" ON documents
    FOR ALL USING (true) WITH CHECK (true);
