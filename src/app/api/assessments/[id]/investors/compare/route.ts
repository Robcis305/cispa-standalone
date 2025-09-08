import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { COMPARISON_CATEGORIES, INVESTOR_EVALUATION_CATEGORIES, type ComparisonDimension } from '@/lib/investorEvaluationConstants'
import { MOCK_COMPANY_SCORES, UPDATED_INVESTOR_CRITERIA_WEIGHTS } from '@/lib/mockInvestorEvaluationData'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params
    const assessmentId = id
    const { investorIds } = await request.json()

    if (!investorIds || !Array.isArray(investorIds) || investorIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid investor IDs provided' },
        { status: 400 }
      )
    }

    if (investorIds.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 investors can be compared at once' },
        { status: 400 }
      )
    }

    // Get assessment dimension scores
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        *,
        answers(*, questions(*))
      `)
      .eq('assessment_id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // For now, use mock investor evaluation scores instead of TRA scores
    // TODO: Replace with actual investor evaluation questionnaire scores
    const dimensionScores = MOCK_COMPANY_SCORES

    // Get investors for comparison (always generate fresh comparison data)
    const { data: investors, error: investorsError } = await supabase
      .from('investors')
      .select('*')
      .in('investor_id', investorIds)

    if (investorsError) {
      return NextResponse.json(
        { error: 'Failed to fetch investors' },
        { status: 500 }
      )
    }

    // Generate fresh comparison data
    const comparisonData = investors.map(investor => {
      const matchScore = calculateMatchScore(dimensionScores, investor)
      const matchReasoning = generateMatchReasoning(dimensionScores, investor)
      
      return {
        investor_id: investor.investor_id,
        match_score: matchScore,
        match_reasoning: matchReasoning,
        investors: investor
      }
    })

    // Generate detailed comparison matrix
    const comparisonMatrix = generateComparisonMatrix(comparisonData, dimensionScores)

    // Generate radar chart data
    const radarChartData = generateRadarChartData(comparisonData, dimensionScores)

    return NextResponse.json({
      assessmentId,
      companyDimensionScores: dimensionScores,
      investors: comparisonData,
      comparisonMatrix,
      radarChartData,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating investor comparison:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateDimensionScores(answers: any[]): Record<string, number> {
  const dimensionTotals: Record<string, { score: number; count: number; maxScore: number }> = {}
  
  answers.forEach(answer => {
    if (answer.questions?.dimension) {
      const dimension = answer.questions.dimension
      if (!dimensionTotals[dimension]) {
        dimensionTotals[dimension] = { score: 0, count: 0, maxScore: 0 }
      }
      
      const score = convertAnswerToScore(answer)
      const maxScore = getMaxScoreForQuestion(answer.questions)
      
      dimensionTotals[dimension].score += score
      dimensionTotals[dimension].count += 1
      dimensionTotals[dimension].maxScore += maxScore
    }
  })
  
  // Calculate percentages
  const dimensionScores: Record<string, number> = {}
  Object.entries(dimensionTotals).forEach(([dimension, data]) => {
    if (data.maxScore > 0) {
      dimensionScores[dimension] = Math.round((data.score / data.maxScore) * 100)
    } else {
      dimensionScores[dimension] = 0
    }
  })
  
  return dimensionScores
}

function convertAnswerToScore(answer: any): number {
  if (!answer.answer_value) return 0
  
  switch (answer.questions?.question_type) {
    case 'scale':
    case 'multiple_choice':
      const selectedOption = answer.questions?.options?.find(
        (opt: any) => opt.value === answer.answer_value
      )
      return selectedOption?.score || 0
    
    case 'number':
      return Math.min(6, Math.max(1, Math.round(Number(answer.answer_value) / 1000000)))
    
    case 'boolean':
      return answer.answer_value === 'true' ? 6 : 1
    
    default:
      return 3
  }
}

function getMaxScoreForQuestion(question: any): number {
  if (!question) return 6 // Default max score
  
  switch (question.question_type) {
    case 'scale':
    case 'multiple_choice':
      if (question.options && Array.isArray(question.options)) {
        return Math.max(...question.options.map((opt: any) => opt.score || 0))
      }
      return 6
    
    case 'boolean':
      return 6
    
    default:
      return 6
  }
}

function calculateMatchScore(
  companyScores: Record<string, number>,
  investor: any
): number {
  // Use updated investor criteria weights or fallback to default category weights
  const investorWeights = UPDATED_INVESTOR_CRITERIA_WEIGHTS[investor.name as keyof typeof UPDATED_INVESTOR_CRITERIA_WEIGHTS]
  
  if (!investorWeights) {
    // Fallback to using default category weights
    const dimensions = Object.keys(COMPARISON_CATEGORIES) as ComparisonDimension[]
    let totalScore = 0
    let totalWeight = 0
    
    dimensions.forEach(dimension => {
      const categoryInfo = COMPARISON_CATEGORIES[dimension]
      const weight = categoryInfo.weight / 10 // Convert to decimal
      const score = companyScores[dimension] || 0
      
      totalScore += score * weight
      totalWeight += weight
    })
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0
  }
  
  // Use investor-specific weights
  let totalScore = 0
  let totalWeight = 0
  
  Object.entries(investorWeights).forEach(([dimension, weight]) => {
    if (companyScores[dimension] !== undefined) {
      const normalizedWeight = weight / 10 // Convert 1-10 scale to decimal
      totalScore += companyScores[dimension] * normalizedWeight
      totalWeight += normalizedWeight
    }
  })
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0
}

function generateMatchReasoning(
  companyScores: Record<string, number>,
  investor: any
): Record<string, any> {
  const investorWeights = UPDATED_INVESTOR_CRITERIA_WEIGHTS[investor.name as keyof typeof UPDATED_INVESTOR_CRITERIA_WEIGHTS] || {}
  const strengths: string[] = []
  const concerns: string[] = []
  const opportunities: string[] = []
  
  Object.entries(companyScores).forEach(([dimension, score]) => {
    const weight = investorWeights[dimension] || COMPARISON_CATEGORIES[dimension as ComparisonDimension]?.weight || 0
    const normalizedWeight = weight / 10 // Convert to decimal
    const isImportantToInvestor = weight >= 7 // High priority on 1-10 scale
    const categoryName = COMPARISON_CATEGORIES[dimension as ComparisonDimension]?.name || dimension
    
    if (score >= 70) {
      if (isImportantToInvestor) {
        strengths.push(`Strong ${categoryName.toLowerCase()} performance (${score}%) aligns with high investor priority (${weight}/10)`)
      } else {
        strengths.push(`Strong ${categoryName.toLowerCase()} performance (${score}%)`)
      }
    } else if (score >= 50) {
      if (isImportantToInvestor) {
        opportunities.push(`Moderate ${categoryName.toLowerCase()} performance (${score}%) could be improved given investor priority (${weight}/10)`)
      }
    } else if (score < 50) {
      if (isImportantToInvestor) {
        concerns.push(`Weak ${categoryName.toLowerCase()} performance (${score}%) in high-priority area (${weight}/10 importance)`)
      } else {
        opportunities.push(`${categoryName.toLowerCase()} improvement opportunity (${score}%)`)
      }
    }
  })
  
  return {
    strengths,
    concerns,
    opportunities,
    focusAreas: investor.focus_areas || [],
    investmentRange: {
      min: investor.investment_range_min,
      max: investor.investment_range_max,
      formatted: formatInvestmentRange(investor.investment_range_min, investor.investment_range_max)
    }
  }
}

function generateComparisonMatrix(investors: any[], companyScores: Record<string, number>) {
  const dimensions = Object.keys(COMPARISON_CATEGORIES) as ComparisonDimension[]
  
  return {
    dimensions,
    companyScores,
    investorData: investors.map(match => ({
      investor: match.investors,
      matchScore: match.match_score,
      dimensionFit: dimensions.reduce((fit, dimension) => {
        const categoryInfo = COMPARISON_CATEGORIES[dimension]
        const investorWeights = UPDATED_INVESTOR_CRITERIA_WEIGHTS[match.investors.name as keyof typeof UPDATED_INVESTOR_CRITERIA_WEIGHTS]
        const rawWeight = investorWeights?.[dimension] || categoryInfo.weight
        const weight = rawWeight / 10 // Convert to decimal
        const companyScore = companyScores[dimension] || 0
        
        fit[dimension] = {
          weight: weight,
          weightPercent: Math.round(rawWeight * 10), // Convert back to percentage for display
          companyScore: companyScore,
          weightedScore: companyScore * weight,
          alignment: getAlignmentLevel(companyScore, weight),
          categoryName: categoryInfo.shortName
        }
        
        return fit
      }, {} as Record<string, any>)
    }))
  }
}

function generateRadarChartData(investors: any[], companyScores: Record<string, number>) {
  const dimensions = Object.keys(COMPARISON_CATEGORIES) as ComparisonDimension[]
  
  return {
    labels: dimensions.map(d => COMPARISON_CATEGORIES[d].shortName),
    datasets: [
      {
        label: 'Company Performance',
        data: dimensions.map(d => companyScores[d] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
      },
      ...investors.map((match, index) => {
        const colors = [
          { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },
          { bg: 'rgba(245, 101, 101, 0.2)', border: 'rgb(245, 101, 101)' },
          { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgb(251, 191, 36)' },
          { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgb(139, 92, 246)' },
          { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgb(236, 72, 153)' }
        ]
        const color = colors[index % colors.length]
        
        return {
          label: `${match.investors.name} Priority`,
          data: dimensions.map(d => {
            const investorWeights = UPDATED_INVESTOR_CRITERIA_WEIGHTS[match.investors.name as keyof typeof UPDATED_INVESTOR_CRITERIA_WEIGHTS]
            const categoryInfo = COMPARISON_CATEGORIES[d]
            return (investorWeights?.[d] || categoryInfo.weight) * 10 // Scale to 0-100
          }),
          backgroundColor: color.bg,
          borderColor: color.border,
          pointBackgroundColor: color.border,
        }
      })
    ]
  }
}

function getAlignmentLevel(companyScore: number, investorWeight: number): string {
  if (investorWeight < 0.1) return 'low-priority'
  if (companyScore >= 70 && investorWeight > 0.2) return 'strong-alignment'
  if (companyScore >= 50 && investorWeight > 0.15) return 'good-alignment'
  if (companyScore < 40 && investorWeight > 0.2) return 'misalignment'
  return 'moderate-alignment'
}

function formatInvestmentRange(min?: number, max?: number): string {
  if (!min && !max) return 'Not specified'
  
  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount}`
  }
  
  if (min && max) return `${formatAmount(min)} - ${formatAmount(max)}`
  if (min) return `${formatAmount(min)}+`
  if (max) return `Up to ${formatAmount(max)}`
  
  return 'Not specified'
}