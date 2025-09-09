const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCompanyProfileFields() {
  try {
    console.log('Adding company profile fields to assessments table...');
    
    const { data, error } = await supabase.rpc('add_company_profile_fields', {});
    
    if (error) {
      console.error('Error adding fields via RPC, trying direct query...');
      
      // Try direct SQL execution
      const { error: sqlError } = await supabase.from('assessments').select('assessment_id').limit(1);
      if (sqlError) {
        console.error('Database connection error:', sqlError.message);
        return;
      }

      console.log('Database connected. The fields may already exist or need to be added manually in Supabase dashboard.');
      console.log('Required fields to add to assessments table:');
      console.log('- industry (TEXT)');
      console.log('- revenue (BIGINT)');  
      console.log('- ebitda (BIGINT)');
      console.log('- revenue_period (TEXT, default: annual)');
      console.log('- employee_count (INTEGER)');
      console.log('- founded_year (INTEGER)');
      
    } else {
      console.log('Successfully added company profile fields');
    }
    
  } catch (err) {
    console.error('Script error:', err.message);
  }
}

addCompanyProfileFields();