'use client'

import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface Investor {
  investor_id: string
  name: string
  type: string
  focus_areas: string[]
  investment_range_min?: number
  investment_range_max?: number
  geographic_focus: string[]
  description: string
  website?: string
}

interface InvestorMatch {
  investor: Investor
  match_score: number
  match_reasoning: {
    strengths: string[]
    concerns: string[]
    opportunities?: string[]
  }
}

interface InvestorComparisonViewProps {
  assessmentId: string
}

export default function InvestorComparisonView({ assessmentId }: InvestorComparisonViewProps) {
  const [matches, setMatches] = useState<InvestorMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvestorMatches()
  }, [assessmentId])

  const fetchInvestorMatches = async () => {
    try {
      setLoading(true)
      
      // First try to get the saved evaluation results from the database
      const response = await fetch(`/api/assessments/${assessmentId}/investors/matches`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch investor evaluation results')
      }
      
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatInvestmentRange = (min?: number, max?: number): string => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading comparison results...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchInvestorMatches}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">No Results Found</h3>
        <p className="text-yellow-700">No investor evaluation results were found for this assessment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Investor Evaluation Results
          </h2>
          <p className="text-gray-600">
            Your custom evaluation of {matches.length} selected investors
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <ArrowDownTrayIcon className="h-5 w-5" />
          Export Results
        </button>
      </div>

      {/* Investor Cards */}
      <div className="grid gap-6">
        {matches.map((match, index) => (
          <div key={match.investor.investor_id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{match.investor.name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                    #{index + 1}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Overall Score:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-3 max-w-32">
                        <div 
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${match.match_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{match.match_score}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Type:</span>
                    <p className="text-sm font-medium">{match.investor.type.toUpperCase()}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Investment Range:</span>
                    <p className="text-sm font-medium">
                      {formatInvestmentRange(match.investor.investment_range_min, match.investor.investment_range_max)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-sm text-gray-600">Focus Areas:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {match.investor.focus_areas?.map((area, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Match Analysis */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Evaluation Summary</h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                {match.match_reasoning?.strengths && match.match_reasoning.strengths.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-800 mb-2">Strengths</h5>
                    <ul className="space-y-1">
                      {match.match_reasoning.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-green-700">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {match.match_reasoning?.opportunities && match.match_reasoning.opportunities.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-800 mb-2">Opportunities</h5>
                    <ul className="space-y-1">
                      {match.match_reasoning.opportunities.map((opportunity, idx) => (
                        <li key={idx} className="text-sm text-yellow-700">• {opportunity}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {match.match_reasoning?.concerns && match.match_reasoning.concerns.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-800 mb-2">Concerns</h5>
                    <ul className="space-y-1">
                      {match.match_reasoning.concerns.map((concern, idx) => (
                        <li key={idx} className="text-sm text-red-700">• {concern}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {(!match.match_reasoning?.strengths?.length && 
                !match.match_reasoning?.opportunities?.length && 
                !match.match_reasoning?.concerns?.length) && (
                <p className="text-gray-500 text-sm">
                  Detailed evaluation reasoning will appear here based on your custom scoring.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No investor matches found. Complete the evaluation workflow first.</p>
        </div>
      )}
    </div>
  )
}