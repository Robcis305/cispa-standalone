const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  console.log('Adding missing company profile columns to assessments table...');
  
  const alterQueries = [
    "ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS industry TEXT;",
    "ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS annual_revenue BIGINT;",
    "ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS funding_amount_sought BIGINT;",
    "ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS investment_type TEXT CHECK (investment_type IN ('control', 'minority', 'either'));",
    "ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS company_stage TEXT CHECK (company_stage IN ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'late_stage'));",
    "ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS geographic_location TEXT;",
    "ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS growth_rate DECIMAL(5,2);",
    "ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS business_model TEXT CHECK (business_model IN ('b2b_saas', 'b2c', 'marketplace', 'hardware', 'biotech', 'fintech', 'other'));"
  ];
  
  try {
    for (let query of alterQueries) {
      console.log('Executing:', query);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error) {
        // Try alternative approach using a stored procedure
        console.log('RPC failed, trying alternative method...');
        console.log('Error:', error.message);
        
        // For now, just log what needs to be done
        console.log('❌ Unable to execute SQL directly via Supabase client');
        console.log('📝 Please execute this SQL manually in Supabase dashboard:');
        console.log('');
        alterQueries.forEach(query => console.log(query));
        console.log('');
        break;
      } else {
        console.log('✅ Column added successfully');
      }
    }
    
    // Test if columns were added
    console.log('Testing updated table structure...');
    const { data: sample, error: testError } = await supabase
      .from('assessments')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing table:', testError.message);
    } else if (sample && sample.length > 0) {
      const newColumns = Object.keys(sample[0]);
      console.log('✅ Updated columns:', newColumns.filter(col => 
        ['industry', 'annual_revenue', 'funding_amount_sought', 'investment_type', 
         'company_stage', 'geographic_location', 'growth_rate', 'business_model'].includes(col)
      ));
    }
    
  } catch (error) {
    console.error('Script error:', error.message);
  }
}

addMissingColumns();