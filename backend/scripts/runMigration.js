/**
 * Run migration script
 * 
 * Usage: node runMigration.js <migration_file>
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(migrationFile) {
  console.log(`\n🔄 Running migration: ${migrationFile}\n`);
  
  const filePath = path.resolve(__dirname, '../database/migrations', migrationFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filePath}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log('📄 SQL Content (preview):');
  console.log(sql.substring(0, 500) + '...\n');
  
  try {
    // For complex migrations with multiple statements and functions,
    // we need to use the RPC endpoint or PostgreSQL driver
    // Supabase client doesn't support raw SQL execution
    
    console.log('⚠️  Note: This script requires manual execution in Supabase SQL Editor');
    console.log('');
    console.log('To execute this migration:');
    console.log('1. Go to https://supabase.com/dashboard/project/ypgjlfsoqsejroewzuer/sql');
    console.log('2. Click "New Query"');
    console.log('3. Copy the contents of:', filePath);
    console.log('4. Paste and click "Run"');
    console.log('');
    console.log('Alternative: Use psql client:');
    console.log(`psql "${supabaseUrl.replace('https://', 'postgres://postgres:[PASSWORD]@')}" < ${filePath}`);
    console.log('');
    
    // We can still verify the functions were created
    console.log('🔍 Checking if migration needs to be run...\n');
    
    // Check if get_windows_counts function exists
    const { data: functions, error } = await supabase
      .rpc('get_windows_counts', {
        p_user_dependency_id: '00000000-0000-0000-0000-000000000000',
        p_date: '2025-01-01'
      });
    
    if (!error) {
      console.log('✅ Function get_windows_counts() already exists!');
      console.log('Migration may have already been applied.\n');
    } else {
      console.log('❌ Function get_windows_counts() not found.');
      console.log('Please run the migration in Supabase SQL Editor.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const migrationFile = process.argv[2] || '002_update_schema_full_c3_o3.sql';
runMigration(migrationFile);
