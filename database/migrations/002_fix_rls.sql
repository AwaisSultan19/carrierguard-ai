-- Fix RLS: The backend handles auth (Clerk JWT), Supabase anon key is used server-side.
-- Drop restrictive RLS policies on carrier_checks and allow the trusted backend to manage data.

DROP POLICY IF EXISTS "Users can view own carrier checks" ON carrier_checks;
DROP POLICY IF EXISTS "Users can insert own carrier checks" ON carrier_checks;

DROP POLICY IF EXISTS "Allow all for authenticated backend" ON carrier_checks;
CREATE POLICY "Allow all for authenticated backend" ON carrier_checks
    FOR ALL USING (true) WITH CHECK (true);

-- Same for audit_logs (will be used by backend)
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Allow all for authenticated backend" ON audit_logs;
CREATE POLICY "Allow all for authenticated backend" ON audit_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Users: backend handles auth, drop per-user RLS
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

DROP POLICY IF EXISTS "Allow all for authenticated backend" ON users;
CREATE POLICY "Allow all for authenticated backend" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- Organizations: backend handles auth, drop per-user RLS
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;

DROP POLICY IF EXISTS "Allow all for authenticated backend" ON organizations;
CREATE POLICY "Allow all for authenticated backend" ON organizations
    FOR ALL USING (true) WITH CHECK (true);

-- Reports: backend handles auth, drop per-user RLS
DROP POLICY IF EXISTS "Users can view own reports" ON reports;

DROP POLICY IF EXISTS "Allow all for authenticated backend" ON reports;
CREATE POLICY "Allow all for authenticated backend" ON reports
    FOR ALL USING (true) WITH CHECK (true);

-- Subscriptions: RLS enabled but no policies exist — default deny blocks all
DROP POLICY IF EXISTS "Allow all for authenticated backend" ON subscriptions;
CREATE POLICY "Allow all for authenticated backend" ON subscriptions
    FOR ALL USING (true) WITH CHECK (true);
