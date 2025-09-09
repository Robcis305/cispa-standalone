// Script to update question dimensions to match the correct categorization
// Run with: node scripts/update-question-dimensions.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define questions that need to be moved to different dimensions
const DIMENSION_UPDATES = [
  // Capital Clarity questions - move from 'financial' to 'legal'
  {
    searchText: "Is the amount of capital being raised clearly justified?",
    currentDimension: "financial",
    newDimension: "legal"
  },
  {
    searchText: "Is there a use-of-funds model tied to financial outcomes?",
    currentDimension: "financial", 
    newDimension: "legal"
  },
  {
    searchText: "Are expectations around valuation realistic?",
    currentDimension: "financial",
    newDimension: "legal"
  },
  {
    searchText: "Has the company modeled different capital scenarios (e.g. equity, debt, hybrid)?",
    currentDimension: "financial",
    newDimension: "legal"
  }
  // Note: keeping 'technology' questions as-is since they map to "Presentation Quality"
];

async function updateQuestionDimensions() {
  console.log('🔄 Starting question dimension updates...');
  
  let updatedCount = 0;
  
  for (const update of DIMENSION_UPDATES) {
    console.log(`\n🔍 Looking for: "${update.searchText.substring(0, 50)}..."`);
    
    // Find the question by text and current dimension
    const { data: questions, error: findError } = await supabase
      .from('questions')
      .select('question_id, question_text, dimension')
      .eq('dimension', update.currentDimension)
      .ilike('question_text', `%${update.searchText}%`);
    
    if (findError) {
      console.error(`❌ Error finding question:`, findError);
      continue;
    }
    
    if (!questions || questions.length === 0) {
      console.log(`⚠️  Question not found in ${update.currentDimension} dimension`);
      continue;
    }
    
    if (questions.length > 1) {
      console.log(`⚠️  Multiple matches found, updating all ${questions.length} questions`);
    }
    
    // Update each matching question
    for (const question of questions) {
      console.log(`   📝 Updating: ${question.question_text.substring(0, 60)}...`);
      
      const { error: updateError } = await supabase
        .from('questions')
        .update({ dimension: update.newDimension })
        .eq('question_id', question.question_id);
      
      if (updateError) {
        console.error(`❌ Error updating question ${question.question_id}:`, updateError);
        continue;
      }
      
      console.log(`   ✅ Moved from '${update.currentDimension}' to '${update.newDimension}'`);
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Successfully updated ${updatedCount} questions!`);
  
  // Verify the updates by showing the current distribution
  console.log('\n🔍 Current question distribution by dimension:');
  
  const { data: distribution, error: distError } = await supabase
    .from('questions')
    .select('dimension')
    .eq('module', 'core');
  
  if (distError) {
    console.error('Error getting distribution:', distError);
    return;
  }
  
  const counts = {};
  distribution.forEach(q => {
    counts[q.dimension] = (counts[q.dimension] || 0) + 1;
  });
  
  Object.entries(counts).forEach(([dim, count]) => {
    console.log(`   ${dim}: ${count} questions`);
  });
  
  // Show some sample questions from each dimension
  console.log('\n📋 Sample questions by dimension:');
  
  for (const dimension of Object.keys(counts)) {
    const { data: samples, error: sampleError } = await supabase
      .from('questions')
      .select('question_text')
      .eq('dimension', dimension)
      .eq('module', 'core')
      .limit(2);
    
    if (!sampleError && samples) {
      console.log(`\n   ${dimension.toUpperCase()}:`);
      samples.forEach((q, i) => {
        console.log(`     ${i + 1}. ${q.question_text.substring(0, 70)}...`);
      });
    }
  }
}

// Run the update
updateQuestionDimensions().catch(console.error);