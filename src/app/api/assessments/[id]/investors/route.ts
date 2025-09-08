import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params
    const assessmentId = id

    // Get assessment data with scores
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        *,
        dimension_scores:answers(*)
      `)
      .eq('assessment_id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Calculate dimension scores from answers
    const dimensionScores = calculateDimensionScores(assessment.dimension_scores)

    // Get all active investors
    const { data: investors, error: investorsError } = await supabase
      .from('investors')
      .select('*')
      .eq('is_active', true)

    if (investorsError) {
      return NextResponse.json(
        { error: 'Failed to fetch investors' },
        { status: 500 }
      )
    }

    // Calculate match scores for each investor
    const matches = investors.map(investor => {
      const matchScore = calculateMatchScore(dimensionScores, investor)
      const matchReasoning = generateMatchReasoning(dimensionScores, investor)
      
      return {
        investor,
        matchScore,
        matchReasoning,
        fitAnalysis: generateFitAnalysis(dimensionScores, investor)
      }
    })

    // Sort by match score (descending)
    matches.sort((a, b) => b.matchScore - a.matchScore)

    // Add rank positions
    matches.forEach((match: any, index: number) => {
      match.rankPosition = index + 1
    })

    // Store matches in database for future reference
    await storeInvestorMatches(assessmentId, matches)

    return NextResponse.json({
      assessmentId,
      totalMatches: matches.length,
      matches: matches.slice(0, 10), // Return top 10 matches
      dimensionScores,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating investor matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateDimensionScores(answers: any[]): Record<string, number> {
  const dimensionTotals: Record<string, { score: number; count: number }> = {}
  
  answers.forEach(answer => {
    if (answer.question?.dimension) {
      const dimension = answer.question.dimension
      if (!dimensionTotals[dimension]) {
        dimensionTotals[dimension] = { score: 0, count: 0 }
      }
      
      // Convert answer to score based on question type
      const score = convertAnswerToScore(answer)
      dimensionTotals[dimension].score += score
      dimensionTotals[dimension].count += 1
    }
  })
  
  // Calculate averages (normalized to 0-100 scale)
  const dimensionScores: Record<string, number> = {}
  Object.entries(dimensionTotals).forEach(([dimension, data]) => {
    dimensionScores[dimension] = Math.round((data.score / data.count) * 16.67) // Scale to 100
  })
  
  return dimensionScores
}

function convertAnswerToScore(answer: any): number {
  if (!answer.answer_value) return 0
  
  // Handle different question types
  switch (answer.question?.question_type) {
    case 'scale':
    case 'multiple_choice':
      // Find the score from the selected option
      const selectedOption = answer.question?.options?.find(
        (opt: any) => opt.value === answer.answer_value
      )
      return selectedOption?.score || 0
    
    case 'number':
      // For number questions, normalize based on context
      return Math.min(6, Math.max(1, Math.round(Number(answer.answer_value) / 1000000))) // Simple normalization
    
    case 'boolean':
      return answer.answer_value === 'true' ? 6 : 1
    
    default:
      return 3 // Neutral score for other types
  }
}

function calculateMatchScore(
  companyScores: Record<string, number>,
  investor: any
): number {
  const weights = investor.criteria_weights || {
    financial: 0.25,
    operational: 0.20,
    market: 0.20,
    technology: 0.15,
    legal: 0.10,
    strategic: 0.10
  }
  
  let totalScore = 0
  let totalWeight = 0
  
  Object.entries(weights).forEach(([dimension, weight]) => {
    if (companyScores[dimension] !== undefined) {
      totalScore += companyScores[dimension] * (weight as number)
      totalWeight += (weight as number)
    }
  })
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0
}

function generateMatchReasoning(
  companyScores: Record<string, number>,
  investor: any
): Record<string, any> {
  const weights = investor.criteria_weights || {}
  const strengths: string[] = []
  const concerns: string[] = []
  
  Object.entries(companyScores).forEach(([dimension, score]) => {
    const weight = weights[dimension] || 0
    const isImportantToInvestor = weight > 0.2
    
    if (score >= 70) {
      if (isImportantToInvestor) {
        strengths.push(`Strong ${dimension} performance (${score}/100) aligns with investor priority`)
      } else {
        strengths.push(`Good ${dimension} performance (${score}/100)`)
      }
    } else if (score < 50 && isImportantToInvestor) {
      concerns.push(`Weak ${dimension} performance (${score}/100) in investor priority area`)
    }
  })
  
  return {
    strengths,
    concerns,
    primaryFit: investor.focus_areas || [],
    investmentRange: {
      min: investor.investment_range_min,
      max: investor.investment_range_max
    }
  }
}

function generateFitAnalysis(
  companyScores: Record<string, number>,
  investor: any
): Record<string, any> {
  const weights = investor.criteria_weights || {}
  const analysis: Record<string, any> = {}
  
  Object.entries(weights).forEach(([dimension, weight]) => {
    const companyScore = companyScores[dimension] || 0
    const weightedScore = companyScore * (weight as number)
    
    analysis[dimension] = {
      companyScore,
      investorWeight: weight,
      weightedScore,
      fit: companyScore >= 60 ? 'strong' : companyScore >= 40 ? 'moderate' : 'weak'
    }
  })
  
  return analysis
}

async function storeInvestorMatches(
  assessmentId: string,
  matches: any[]
): Promise<void> {
  const supabase = createClient()
  
  // First, delete existing matches for this assessment
  await supabase
    .from('investor_matches')
    .delete()
    .eq('assessment_id', assessmentId)
  
  // Insert new matches
  const matchRecords = matches.map((match, index) => ({
    assessment_id: assessmentId,
    investor_id: match.investor.investor_id,
    match_score: match.matchScore,
    match_reasoning: match.matchReasoning,
    rank_position: index + 1
  }))
  
  await supabase
    .from('investor_matches')
    .insert(matchRecords)
}