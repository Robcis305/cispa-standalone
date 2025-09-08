import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

interface EvaluationScore {
  dimension: string
  score: number
  notes: string
}

interface EvaluationRequest {
  investorEvaluations: Record<string, EvaluationScore[]>
  selectedCategories: string[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params
    const assessmentId = id
    const { investorEvaluations, selectedCategories }: EvaluationRequest = await request.json()

    // Validate input
    if (!investorEvaluations || Object.keys(investorEvaluations).length === 0) {
      return NextResponse.json(
        { error: 'No investor evaluations provided' },
        { status: 400 }
      )
    }

    // Check if assessment exists
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('assessment_id')
      .eq('assessment_id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Clear ALL existing matches for this assessment to ensure only evaluated investors appear
    const { error: deleteError } = await supabase
      .from('investor_matches')
      .delete()
      .eq('assessment_id', assessmentId)

    if (deleteError) {
      console.error('Error clearing existing matches:', deleteError)
      // Continue anyway - we'll handle duplicates by updating existing records
    }

    // Process each investor evaluation
    const results = []
    for (const [investorId, evaluations] of Object.entries(investorEvaluations)) {
      
      // Calculate overall match score based on evaluation
      const overallScore = calculateOverallScore(evaluations, selectedCategories)
      
      // Generate match reasoning from evaluation scores
      const matchReasoning = generateMatchReasoning(evaluations)
      
      // Create new match record (we cleared existing ones above)
      const { error: insertError } = await supabase
        .from('investor_matches')
        .insert({
          assessment_id: assessmentId,
          investor_id: investorId,
          match_score: overallScore,
          match_reasoning: {
            evaluationBased: true,
            selectedCategories,
            evaluations,
            ...matchReasoning
          }
        })

      if (insertError) {
        console.error('Error creating investor match:', insertError)
        return NextResponse.json(
          { error: 'Failed to save investor evaluation' },
          { status: 500 }
        )
      }

      results.push({
        investorId,
        overallScore,
        evaluationCount: evaluations.length
      })
    }

    // Update rank positions for all matches in this assessment
    await updateRankPositions(supabase, assessmentId)

    return NextResponse.json({
      message: 'Investor evaluations saved successfully',
      results,
      evaluatedInvestors: Object.keys(investorEvaluations).length,
      selectedCategories,
      savedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error saving investor evaluations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateOverallScore(evaluations: EvaluationScore[], selectedCategories: string[]): number {
  if (evaluations.length === 0) return 0

  // For now, use simple average. Could be enhanced with category weights
  const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0)
  const averageScore = totalScore / evaluations.length
  
  // Convert from 1-10 scale to percentage
  return Math.round((averageScore / 10) * 100)
}

function generateMatchReasoning(evaluations: EvaluationScore[]) {
  const strengths: string[] = []
  const concerns: string[] = []
  const opportunities: string[] = []

  evaluations.forEach(evaluation => {
    const categoryName = evaluation.dimension.replace('_', ' ').toLowerCase()
    
    if (evaluation.score >= 8) {
      strengths.push(`Excellent ${categoryName} rating (${evaluation.score}/10)${evaluation.notes ? ': ' + evaluation.notes : ''}`)
    } else if (evaluation.score >= 6) {
      if (evaluation.notes) {
        opportunities.push(`Good ${categoryName} rating (${evaluation.score}/10): ${evaluation.notes}`)
      } else {
        strengths.push(`Good ${categoryName} rating (${evaluation.score}/10)`)
      }
    } else if (evaluation.score >= 4) {
      opportunities.push(`Moderate ${categoryName} rating (${evaluation.score}/10)${evaluation.notes ? ': ' + evaluation.notes : ''}`)
    } else {
      concerns.push(`Low ${categoryName} rating (${evaluation.score}/10)${evaluation.notes ? ': ' + evaluation.notes : ''}`)
    }
  })

  return {
    strengths,
    concerns,
    opportunities
  }
}

async function updateRankPositions(supabase: any, assessmentId: string) {
  // Get all matches for this assessment, ordered by score
  const { data: matches, error } = await supabase
    .from('investor_matches')
    .select('match_id, match_score')
    .eq('assessment_id', assessmentId)
    .order('match_score', { ascending: false })

  if (error || !matches) {
    console.error('Error fetching matches for ranking:', error)
    return
  }

  // Update rank positions
  const updates = matches.map((match: any, index: number) => 
    supabase
      .from('investor_matches')
      .update({ rank_position: index + 1 })
      .eq('match_id', match.match_id)
  )

  await Promise.all(updates)
}