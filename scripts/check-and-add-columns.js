const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndAddColumns() {
  try {
    console.log('Checking current assessments table structure...');
    
    // First, let's see what columns exist by querying a record
    const { data: sample, error: sampleError } = await supabase
      .from('assessments')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error querying assessments:', sampleError.message);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('Current columns in assessments table:', Object.keys(sample[0]));
      
      // Check for missing company profile columns
      const requiredColumns = [
        'industry', 'annual_revenue', 'funding_amount_sought', 
        'investment_type', 'company_stage', 'geographic_location', 
        'growth_rate', 'business_model'
      ];
      
      const existingColumns = Object.keys(sample[0]);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      console.log('Missing columns:', missingColumns);
      
      if (missingColumns.length > 0) {
        console.log('⚠️  Some company profile columns are missing from the database.');
        console.log('⚠️  You may need to add these columns in Supabase dashboard or with direct SQL.');
        console.log('⚠️  For now, the save operation will only update existing columns.');
        
        // Try a minimal update to see what works
        console.log('Testing basic update with existing columns...');
        const testId = sample[0].assessment_id;
        const { error: updateError } = await supabase
          .from('assessments')
          .update({ 
            company_name: sample[0].company_name // Keep same value, just test update
          })
          .eq('assessment_id', testId);
          
        if (updateError) {
          console.error('❌ Basic update failed:', updateError.message);
        } else {
          console.log('✅ Basic update works');
        }
      } else {
        console.log('✅ All required columns exist');
      }
    } else {
      console.log('No assessments found in database');
    }
    
  } catch (err) {
    console.error('Script error:', err.message);
  }
}

checkAndAddColumns();