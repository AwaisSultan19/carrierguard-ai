-- CarrierGuard AI - Initial Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subscription_plan TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (synced from Clerk via webhook)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CarrierChecks (search history)
CREATE TABLE IF NOT EXISTS carrier_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    mc_number TEXT,
    dot_number TEXT,
    carrier_name TEXT,
    risk_score NUMERIC(5,2),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_checks_user_id ON carrier_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_carrier_checks_created_at ON carrier_checks(created_at DESC);

-- 4. Reports (PDF reports generated)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_check_id UUID REFERENCES carrier_checks(id) ON DELETE CASCADE,
    ai_summary TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AuditLogs (user activity trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 6. Alerts (carrier monitoring)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_check_id UUID REFERENCES carrier_checks(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subscriptions (Stripe billing)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE clerk_id = current_setting('request.jwt.claims')::json->>'sub')
    );

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (clerk_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (clerk_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can view own carrier checks" ON carrier_checks
    FOR SELECT USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can insert own carrier checks" ON carrier_checks
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (
        carrier_check_id IN (
            SELECT id FROM carrier_checks WHERE user_id = current_setting('request.jwt.claims')::json->>'sub'
        )
    );

CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can insert own audit logs" ON audit_logs
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');
