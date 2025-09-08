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

    // Get investor matches from the database (these are the ones you evaluated)
    const { data: matches, error: matchesError } = await supabase
      .from('investor_matches')
      .select(`
        match_id,
        match_score,
        match_reasoning,
        rank_position,
        created_at,
        investors!inner (
          investor_id,
          name,
          type,
          focus_areas,
          investment_range_min,
          investment_range_max,
          geographic_focus,
          description,
          website
        )
      `)
      .eq('assessment_id', assessmentId)
      .order('match_score', { ascending: false })

    if (matchesError) {
      console.error('Error fetching investor matches:', matchesError)
      return NextResponse.json(
        { error: 'Failed to fetch investor evaluation results' },
        { status: 500 }
      )
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json(
        { error: 'No investor evaluation results found. Please complete the evaluation workflow first.' },
        { status: 404 }
      )
    }

    // Transform the data to match the expected format
    const formattedMatches = matches.map((match: any, index: number) => ({
      investor: {
        investor_id: match.investors.investor_id,
        name: match.investors.name,
        type: match.investors.type,
        focus_areas: match.investors.focus_areas || [],
        investment_range_min: match.investors.investment_range_min,
        investment_range_max: match.investors.investment_range_max,
        geographic_focus: match.investors.geographic_focus || [],
        description: match.investors.description,
        website: match.investors.website
      },
      match_score: match.match_score,
      match_reasoning: match.match_reasoning || {
        strengths: [],
        concerns: [],
        opportunities: []
      },
      rank_position: match.rank_position || (index + 1)
    }))

    return NextResponse.json({
      assessmentId,
      totalMatches: formattedMatches.length,
      matches: formattedMatches,
      evaluationType: 'custom_evaluation',
      generatedAt: matches[0]?.created_at || new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching investor evaluation results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}