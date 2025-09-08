// Question seeding script for Transaction Readiness Assessment
// Run with: node scripts/seed-questions.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to set your Supabase credentials here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Real TRA Questions from Enhanced TRA Assessment Tool CSV
const TRA_QUESTIONS = {
  strategic: [
    {
      question_text: "Is there a clear and compelling 3-year strategic plan?",
      help_text: "Written strategic plan document, board presentations, milestone tracking",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Can the CEO articulate a differentiated position in the market?",
      help_text: "CEO interview, pitch practice sessions, competitive analysis",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Is the investment thesis (organic growth, M&A, GTM expansion, etc.) well-defined?",
      help_text: "Investment memo, growth strategy documents, market analysis",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are key growth levers quantified and linked to specific initiatives?",
      help_text: "Growth model, initiative tracking, KPI dashboard",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Is the company vision clearly tied to a credible path to scale or exit?",
      help_text: "Business plan, exit scenario analysis, comparable company research",
      is_core: true,
      is_required: true,
      question_type: "scale"
    }
  ],
  operational: [
    {
      question_text: "Does the current leadership team have experience aligned with the growth plan?",
      help_text: "Leadership resumes, reference checks, performance track records, Catalyst Index™ assessments",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are key roles filled (CEO, Finance, GTM, Ops)?",
      help_text: "Organizational chart, role descriptions, hiring plans, interim solutions",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Is there evidence of prior execution success by key leaders?",
      help_text: "Performance reviews, achievement documentation, reference calls, case studies",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are incentives aligned across the leadership team?",
      help_text: "Equity plans, compensation studies, retention agreements, performance metrics",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are there known gaps that will require hiring or partnering?",
      help_text: "Gap analysis, hiring plans, partnership strategies, budget allocations",
      is_core: false,
      is_required: false,
      question_type: "scale"
    }
  ],
  market: [
    {
      question_text: "Is the Ideal Customer Profile (ICP) clearly defined and validated?",
      help_text: "Customer research, ICP documentation, sales data analysis, customer interviews",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Does the company have defensible differentiation or moat?",
      help_text: "Competitive analysis, IP portfolio, customer switching cost analysis, barrier assessment",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are there clear competitors mapped with relative positioning?",
      help_text: "Competitive landscape maps, positioning studies, win/loss analysis, competitive intelligence reports",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Is TAM/SAM/SOM analysis complete and credible?",
      help_text: "Market research reports, sizing methodology, data sources, growth projections",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Is there market demand data or customer feedback validating traction?",
      help_text: "Sales pipeline data, customer testimonials, market research, usage metrics, retention data",
      is_core: true,
      is_required: true,
      question_type: "scale"
    }
  ],
  financial: [
    {
      question_text: "Are historical financials accurate, complete, and in GAAP or close equivalent?",
      help_text: "Financial statements, audit reports, accounting policies documentation",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are there normalized EBITDA adjustments with justification?",
      help_text: "EBITDA reconciliation schedule, supporting documentation for adjustments",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are customer/revenue cohorts and margin trends clearly understood?",
      help_text: "Customer analysis reports, margin analysis by segment, cohort studies",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are projections built with defensible assumptions?",
      help_text: "Financial model, assumption documentation, sensitivity analysis",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Is there a clear audit trail of key financial decisions and changes?",
      help_text: "Board minutes, accounting memos, management letters, restatement documentation",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Is the amount of capital being raised clearly justified?",
      help_text: "Cash flow projections, capital requirements model, scenario analysis, milestone-based funding plan",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Is there a use-of-funds model tied to financial outcomes?",
      help_text: "Use-of-funds model, ROI analysis, milestone tracking, accountability framework",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are expectations around valuation realistic?",
      help_text: "Valuation analysis, comparable company studies, DCF models, market research",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Has the company modeled different capital scenarios (e.g. equity, debt, hybrid)?",
      help_text: "Capital structure analysis, scenario modeling, term sheet comparisons, advisor recommendations",
      is_core: false,
      is_required: false,
      question_type: "scale"
    }
  ],
  technology: [
    {
      question_text: "Is there a professional investor deck that tells a coherent story?",
      help_text: "Investor pitch deck, feedback from advisors, presentation practice sessions",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Does the CIM (if created) answer key diligence questions?",
      help_text: "CIM document, diligence question list, investor feedback",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Is the financial model clean, dynamic, and investor-usable?",
      help_text: "Financial model file, model review checklist, investor feedback",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Are visual materials aligned with CIS investor format standards?",
      help_text: "Material review against CIS standards, design quality assessment",
      is_core: true,
      is_required: true,
      question_type: "scale"
    },
    {
      question_text: "Has the team practiced/received feedback on investor Q&A?",
      help_text: "Practice session notes, Q&A preparation materials, feedback documentation, video recordings",
      is_core: false,
      is_required: false,
      question_type: "scale"
    },
    {
      question_text: "Is the company open to multiple investor types (e.g. PE, strategic)?",
      help_text: "Investor strategy document, deal structure analysis, advisor input",
      is_core: false,
      is_required: false,
      question_type: "scale"
    }
  ]
};

const QUESTION_OPTIONS = {
  scale: [
    { label: 'Not Ready', value: '1', score: 1 },
    { label: 'Poor', value: '2', score: 2 },
    { label: 'Fair', value: '3', score: 3 },
    { label: 'Good', value: '4', score: 4 },
    { label: 'Excellent', value: '5', score: 5 }
  ],
  boolean: [
    { label: 'No', value: 'false', score: 1 },
    { label: 'Yes', value: 'true', score: 5 }
  ]
};

async function seedQuestions() {
  console.log('🌱 Starting question seeding...');
  
  // First, get all core questions to be replaced
  console.log('🔍 Finding existing core module questions...');
  const { data: coreQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('question_id')
    .eq('module', 'core');
  
  if (fetchError) {
    console.error('Error fetching core questions:', fetchError);
    return;
  }
  
  if (coreQuestions && coreQuestions.length > 0) {
    const questionIds = coreQuestions.map(q => q.question_id);
    console.log(`Found ${questionIds.length} core questions to replace`);
    
    // Clear answers referencing these questions
    console.log('🗑️ Clearing existing answers...');
    const { error: deleteAnswersError } = await supabase
      .from('answers')
      .delete()
      .in('question_id', questionIds);
    
    if (deleteAnswersError) {
      console.error('Error clearing existing answers:', deleteAnswersError);
      return;
    }
    console.log(`✅ Cleared answers for ${questionIds.length} questions`);
    
    // Clear assessment references to these questions
    console.log('🗑️ Clearing assessment question references...');
    const { error: clearAssessmentRefsError } = await supabase
      .from('assessments')
      .update({ current_question_id: null })
      .in('current_question_id', questionIds);
    
    if (clearAssessmentRefsError) {
      console.error('Error clearing assessment references:', clearAssessmentRefsError);
      return;
    }
    console.log('✅ Cleared assessment question references');
    
    // Now safe to delete questions
    console.log('🗑️ Deleting existing core questions...');
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('module', 'core');
    
    if (deleteError) {
      console.error('Error deleting existing questions:', deleteError);
      return;
    }
    
    console.log('✅ Successfully deleted existing core questions');
  } else {
    console.log('📝 No existing core questions found');
  }
  
  let orderIndex = 1;
  let insertedCount = 0;
  
  // Insert questions by dimension
  for (const [dimension, questions] of Object.entries(TRA_QUESTIONS)) {
    console.log(`\n📝 Seeding ${dimension} questions...`);
    
    for (const questionData of questions) {
      const questionRecord = {
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        dimension: dimension,
        module: 'core',
        order_index: orderIndex++,
        weight: 1,
        scoring_impact: 1,
        help_text: questionData.help_text,
        is_required: questionData.is_required,
        is_active: true,
        is_core: questionData.is_core,
        branching_conditions: null,
        options: QUESTION_OPTIONS[questionData.question_type] || [],
        validation_rules: null
      };
      
      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionRecord);
      
      if (insertError) {
        console.error(`❌ Error inserting question: ${questionData.question_text}`, insertError);
        continue;
      }
      
      insertedCount++;
      console.log(`   ✅ ${questionData.question_text.substring(0, 60)}...`);
    }
  }
  
  console.log(`\n🎉 Successfully seeded ${insertedCount} questions!`);
  console.log('\nBreakdown by dimension:');
  
  for (const [dimension, questions] of Object.entries(TRA_QUESTIONS)) {
    const coreCount = questions.filter(q => q.is_core).length;
    const optionalCount = questions.filter(q => !q.is_core).length;
    console.log(`   ${dimension}: ${coreCount} core + ${optionalCount} optional = ${questions.length} total`);
  }
  
  console.log('\n🔍 Verifying seed results...');
  
  // Verify the seeded data
  const { data: seededQuestions, error: verifyError } = await supabase
    .from('questions')
    .select('dimension, is_core, question_text')
    .eq('module', 'core')
    .order('dimension')
    .order('order_index');
  
  if (verifyError) {
    console.error('Error verifying seeded questions:', verifyError);
    return;
  }
  
  console.log(`\n✅ Verification complete: ${seededQuestions.length} questions found in database`);
  console.log('Sample questions:');
  
  seededQuestions.slice(0, 3).forEach((q, i) => {
    console.log(`   ${i + 1}. [${q.dimension}] ${q.is_core ? '🔒' : '📝'} ${q.question_text.substring(0, 50)}...`);
  });
}

// Run the seeding
seedQuestions().catch(console.error);