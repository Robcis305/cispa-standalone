import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import type { Assessment, Investor } from '@/types/database.types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params
    const assessmentId = id
    const { companyProfile } = await request.json()

    // Get basic assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('assessment_id, title, company_name')
      .eq('assessment_id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Check if company profile data was provided
    if (!companyProfile || !hasCompanyProfileData(companyProfile)) {
      return NextResponse.json(
        { error: 'Company profile data is required for investor pre-screening. Please complete the company profile first.' },
        { status: 400 }
      )
    }

    // Get all active investors with their matching criteria
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
    const prescreeningResults = investors
      .map(investor => ({
        investor,
        matchScore: calculatePrescreeningScore(companyProfile, investor),
        matchReasons: generatePrescreeningReasons(companyProfile, investor)
      }))
      .filter(result => result.matchScore > 0) // Only include investors with some match
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by highest match score
      .slice(0, 10) // Top 10 matches

    return NextResponse.json({
      assessmentId,
      companyProfile,
      prescreeningResults,
      totalInvestorsScreened: investors.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in investor pre-screening:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function hasCompanyProfileData(companyProfile: any): boolean {
  return !!(
    companyProfile &&
    companyProfile.industry &&
    companyProfile.annual_revenue !== null &&
    companyProfile.funding_amount_sought !== null &&
    companyProfile.investment_type &&
    companyProfile.company_stage &&
    companyProfile.geographic_location &&
    companyProfile.business_model
  )
}

function calculatePrescreeningScore(companyProfile: any, investor: Investor): number {
  let score = 0
  let maxScore = 0

  // Industry match (30 points)
  maxScore += 30
  if (companyProfile.industry && investor.focus_areas?.length) {
    if (investor.focus_areas.includes(companyProfile.industry)) {
      score += 30
    }
  }

  // Investment amount match (25 points)
  maxScore += 25
  if (companyProfile.funding_amount_sought && investor.investment_range_min && investor.investment_range_max) {
    const fundingAmount = companyProfile.funding_amount_sought
    const minRange = investor.investment_range_min
    const maxRange = investor.investment_range_max
    
    if (fundingAmount >= minRange && fundingAmount <= maxRange) {
      score += 25 // Perfect match
    } else if (fundingAmount >= minRange * 0.8 && fundingAmount <= maxRange * 1.2) {
      score += 15 // Close match
    } else if (fundingAmount >= minRange * 0.5 && fundingAmount <= maxRange * 1.5) {
      score += 8 // Partial match
    }
  }

  // Company stage match (20 points)
  maxScore += 20
  if (companyProfile.company_stage && investor.focus_areas?.length) {
    // Simple stage matching for now
    if (investor.focus_areas.includes(companyProfile.company_stage)) {
      score += 20
    }
  }

  // Investment type match (15 points)
  maxScore += 15
  if (companyProfile.investment_type) {
    // Assume most investors are flexible with investment type
    score += 10 // Default partial score
  }

  // Business model match (15 points)
  maxScore += 15
  if (companyProfile.business_model && investor.focus_areas?.length) {
    if (investor.focus_areas.includes(companyProfile.business_model)) {
      score += 15
    }
  }

  // Revenue range match (10 points)
  maxScore += 10
  if (companyProfile.annual_revenue) {
    // Simple revenue scoring - higher revenue generally better
    if (companyProfile.annual_revenue > 1000000) {
      score += 10
    } else if (companyProfile.annual_revenue > 100000) {
      score += 6
    }
  }

  // Growth rate match (10 points)  
  maxScore += 10
  if (companyProfile.growth_rate) {
    if (companyProfile.growth_rate >= 50) {
      score += 10
    } else if (companyProfile.growth_rate >= 20) {
      score += 6
    } else if (companyProfile.growth_rate >= 10) {
      score += 3
    }
  }

  // Geographic match (5 points)
  maxScore += 5
  if (companyProfile.geographic_location && investor.geographic_focus?.length) {
    // Check if investor has geographic focus that matches or includes "global"
    if (investor.geographic_focus.includes('global') || 
        investor.geographic_focus.some(geo => 
          companyProfile.geographic_location?.toLowerCase().includes(geo.toLowerCase())
        )) {
      score += 5
    }
  }

  // Return percentage score (0-100)
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
}

function generatePrescreeningReasons(companyProfile: any, investor: Investor): string[] {
  const reasons: string[] = []

  // Industry alignment
  if (companyProfile.industry && investor.focus_areas?.includes(companyProfile.industry)) {
    reasons.push(`Strong industry focus match: ${companyProfile.industry}`)
  }

  // Investment amount alignment
  if (companyProfile.funding_amount_sought && investor.investment_range_min && investor.investment_range_max) {
    const fundingAmount = companyProfile.funding_amount_sought
    const minRange = investor.investment_range_min
    const maxRange = investor.investment_range_max
    
    if (fundingAmount >= minRange && fundingAmount <= maxRange) {
      reasons.push(`Perfect investment size match: ${formatAmount(fundingAmount)} within range ${formatAmount(minRange)}-${formatAmount(maxRange)}`)
    }
  }

  // Stage alignment
  if (companyProfile.company_stage) {
    reasons.push(`Company stage alignment: ${companyProfile.company_stage.replace('_', ' ')}`)
  }

  // Investment type alignment
  if (companyProfile.investment_type) {
    reasons.push(`Investment type preference: ${companyProfile.investment_type}`)
  }

  // Business model alignment
  if (companyProfile.business_model && investor.focus_areas?.includes(companyProfile.business_model)) {
    reasons.push(`Business model focus: ${companyProfile.business_model.replace('_', ' ')}`)
  }

  // Revenue alignment
  if (companyProfile.annual_revenue && companyProfile.annual_revenue > 1000000) {
    reasons.push(`Strong revenue profile: ${formatAmount(companyProfile.annual_revenue)} annual revenue`)
  }

  // Growth rate alignment
  if (companyProfile.growth_rate && companyProfile.growth_rate >= 20) {
    reasons.push(`Strong growth trajectory: ${companyProfile.growth_rate}% growth rate`)
  }

  // Geographic alignment
  if (companyProfile.geographic_location && investor.geographic_focus?.includes('global')) {
    reasons.push('Global investment focus covers your location')
  }

  return reasons
}

function formatAmount(amount: number): string {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
  return `$${amount}`
}