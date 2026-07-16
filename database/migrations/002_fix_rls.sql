-- Fix RLS: The backend handles auth (Clerk JWT), Supabase anon key is used server-side.
-- Drop restrictive RLS policies on carrier_checks and allow the trusted backend to manage data.

DROP POLICY IF EXISTS "Users can view own carrier checks" ON carrier_checks;
DROP POLICY IF EXISTS "Users can insert own carrier checks" ON carrier_checks;

CREATE POLICY "Allow all for authenticated backend" ON carrier_checks
    FOR ALL USING (true) WITH CHECK (true);

-- Same for audit_logs (will be used by backend)
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;

CREATE POLICY "Allow all for authenticated backend" ON audit_logs
    FOR ALL USING (true) WITH CHECK (true);
