require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

async function main() {
  console.log('\n=== CarrierGuard AI - Migration Runner ===\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.warn('WARNING: Using SUPABASE_ANON_KEY - RLS policies may block operations.');
    console.warn('For server-side operations, add SUPABASE_SERVICE_ROLE_KEY to .env');
    console.warn('');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Connecting to Supabase project...');
  console.log('Project URL:', supabaseUrl);

  // Test connection by counting carrier_checks
  const { count, error: countError } = await supabase
    .from('carrier_checks')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('\nConnection test FAILED:', countError.message);
    if (countError.message.includes('permission denied') || countError.message.includes('violates row-level security')) {
      console.log('\nThis is likely due to Row Level Security (RLS) policies.');
      console.log('\nTo fix, run this SQL in your Supabase SQL Editor:');
      console.log('\n  DROP POLICY IF EXISTS "Users can view own carrier checks" ON carrier_checks;');
      console.log('  DROP POLICY IF EXISTS "Users can insert own carrier checks" ON carrier_checks;');
      console.log('  CREATE POLICY "Allow all for authenticated backend" ON carrier_checks');
      console.log('    FOR ALL USING (true) WITH CHECK (true);');
      console.log('');
      console.log('OR add your SUPABASE_SERVICE_ROLE_KEY to backend/.env');
      console.log('(Find it at: Supabase Dashboard > Settings > API > Project API keys > service_role)');
    }
    process.exit(1);
  }

  console.log('Connection successful! Current carrier_checks count:', count);

  // Try inserting a test record
  const { data: inserted, error: insertError } = await supabase
    .from('carrier_checks')
    .insert({
      user_id: 'migration_test',
      mc_number: 'TEST',
      dot_number: 'TEST',
      carrier_name: 'Migration Test',
      risk_score: 0,
      status: 'test',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('\nInsert test FAILED:', insertError.message);
    if (insertError.message.includes('permission denied') || insertError.message.includes('violates row-level security')) {
      console.log('\nRLS is blocking inserts. You need to fix this.');
      console.log('\nOption 1: Add SUPABASE_SERVICE_ROLE_KEY to backend/.env');
      console.log('  Go to: Supabase Dashboard > Settings > API > Project API keys');
      console.log('  Copy the "service_role" key and add it to your .env file.');
      console.log('');
      console.log('Option 2: Run the RLS migration SQL in the Supabase SQL Editor');
      console.log('  Open: https://supabase.com/dashboard/project/_/sql/new');
      console.log('  The SQL is in database/migrations/002_fix_rls.sql');
    }
  } else {
    console.log('Insert test successful! Record ID:', inserted.id);

    // Clean up test record
    await supabase.from('carrier_checks').delete().eq('id', inserted.id);
    console.log('Test record cleaned up.');
    console.log('\nEverything is working correctly!');
  }

  console.log('\n=== Migration check complete ===\n');
}

main().catch(console.error);
