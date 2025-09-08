'use client'

import { useState, useEffect } from 'react'
import { CheckIcon, ChartBarIcon, UserGroupIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import InvestorEvaluationInterface from './InvestorEvaluationInterface'

interface PrescreeningResult {
  investor: {
    investor_id: string
    name: string
    type: string
    focus_areas: string[]
    investment_range_min?: number
    investment_range_max?: number
    description: string
    website?: string
  }
  matchScore: number
  matchReasons: string[]
}

interface PrescreeningData {
  prescreeningResults: PrescreeningResult[]
  companyProfile: any
  totalInvestorsScreened: number
  generatedAt: string
}

interface InvestorWorkflowProps {
  assessmentId: string
  onComplete: (results: any) => void
  onBack: () => void
}

type WorkflowStep = 'prescreening' | 'selection' | 'evaluation' | 'results'

export default function InvestorWorkflow({
  assessmentId,
  onComplete,
  onBack
}: InvestorWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('prescreening')
  const [prescreeningData, setPrescreeningData] = useState<PrescreeningData | null>(null)
  const [selectedInvestors, setSelectedInvestors] = useState<PrescreeningResult[]>([])
  const [evaluationResults, setEvaluationResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [
    { id: 'prescreening', title: 'Pre-screening', description: 'Surface top investors', icon: ChartBarIcon },
    { id: 'selection', title: 'Selection', description: 'Choose up to 5 investors', icon: UserGroupIcon },
    { id: 'evaluation', title: 'Evaluation', description: 'Score selected investors', icon: ClipboardDocumentCheckIcon },
    { id: 'results', title: 'Results', description: 'View comparison', icon: CheckIcon }
  ]

  useEffect(() => {
    if (currentStep === 'prescreening') {
      handlePrescreening()
    }
  }, [])

  const handlePrescreening = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get company profile from localStorage (temporary solution until database schema is updated)
      const companyProfileData = localStorage.getItem(`companyProfile_${assessmentId}`)
      let companyProfile = null
      
      if (companyProfileData) {
        companyProfile = JSON.parse(companyProfileData)
      }

      const response = await fetch(`/api/assessments/${assessmentId}/investors/prescreening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyProfile })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Pre-screening failed')
      }

      const data = await response.json()
      setPrescreeningData(data)
      setCurrentStep('selection')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInvestorToggle = (result: PrescreeningResult) => {
    setSelectedInvestors(prev => {
      const isSelected = prev.some(inv => inv.investor.investor_id === result.investor.investor_id)
      
      if (isSelected) {
        return prev.filter(inv => inv.investor.investor_id !== result.investor.investor_id)
      } else {
        if (prev.length >= 5) {
          alert('You can select a maximum of 5 investors for evaluation.')
          return prev
        }
        return [...prev, result]
      }
    })
  }

  const handleStartEvaluation = () => {
    if (selectedInvestors.length === 0) {
      alert('Please select at least one investor to evaluate.')
      return
    }
    setCurrentStep('evaluation')
  }

  const handleEvaluationComplete = async (evaluationData: any) => {
    setLoading(true)
    setError(null)

    try {
      // Extract selected categories and weights from evaluation data
      const firstInvestorData = evaluationData[Object.keys(evaluationData)[0]] || []
      const selectedCategories = firstInvestorData.map((score: any) => score.dimension)
      
      const response = await fetch(`/api/assessments/${assessmentId}/investors/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          investorEvaluations: evaluationData,
          selectedCategories
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save evaluation results')
      }

      const results = await response.json()
      setEvaluationResults(results)
      setCurrentStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save evaluation')
    } finally {
      setLoading(false)
    }
  }

  const handleViewComparison = () => {
    onComplete(evaluationResults)
  }

  if (loading && currentStep === 'prescreening') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Running investor pre-screening...</p>
        <p className="text-sm text-gray-500 mt-2">Analyzing company profile and matching with investors</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setError(null)
              if (currentStep === 'prescreening') {
                handlePrescreening()
              }
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
          <button
            onClick={onBack}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index
          const Icon = step.icon

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : isActive
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {isCompleted ? (
                  <CheckIcon className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>
              <div className="ml-3 text-left">
                <p className={`font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.title}
                </p>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`mx-6 h-0.5 w-16 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      {currentStep === 'selection' && prescreeningData && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-blue-900 mb-2">
              Step 2: Select Investors to Evaluate
            </h2>
            <p className="text-blue-800">
              Pre-screening found {prescreeningData.prescreeningResults.length} matching investors 
              from {prescreeningData.totalInvestorsScreened} total investors. 
              Select up to 5 investors for detailed evaluation.
            </p>
          </div>

          <div className="grid gap-4">
            {prescreeningData.prescreeningResults.map((result, index) => (
              <div
                key={result.investor.investor_id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedInvestors.some(inv => inv.investor.investor_id === result.investor.investor_id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInvestorToggle(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        #{index + 1} {result.investor.name}
                      </h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        {result.matchScore}% match
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {result.investor.type.toUpperCase()} • {result.investor.focus_areas.join(', ')}
                    </p>
                    
                    <div className="space-y-1">
                      {result.matchReasons.slice(0, 3).map((reason, idx) => (
                        <p key={idx} className="text-sm text-gray-700">• {reason}</p>
                      ))}
                    </div>
                  </div>
                  
                  <input
                    type="checkbox"
                    checked={selectedInvestors.some(inv => inv.investor.investor_id === result.investor.investor_id)}
                    readOnly
                    className="mt-1"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            
            <div className="text-sm text-gray-600">
              {selectedInvestors.length} of 5 investors selected
            </div>

            <button
              onClick={handleStartEvaluation}
              disabled={selectedInvestors.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Evaluation
            </button>
          </div>
        </div>
      )}

      {currentStep === 'evaluation' && (
        <InvestorEvaluationInterface
          selectedInvestors={selectedInvestors.map(result => result.investor)}
          onEvaluationComplete={handleEvaluationComplete}
          onBack={() => setCurrentStep('selection')}
        />
      )}

      {currentStep === 'results' && evaluationResults && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckIcon className="h-8 w-8 text-green-600" />
              <h2 className="text-2xl font-bold text-green-900">
                Evaluation Complete!
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-800 mb-2">Summary</h3>
                <ul className="space-y-1 text-green-700">
                  <li>• {evaluationResults.evaluatedInvestors} investors evaluated</li>
                  <li>• {evaluationResults.selectedCategories?.length || 0} categories assessed</li>
                  <li>• Evaluation saved at {new Date(evaluationResults.savedAt).toLocaleString()}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-800 mb-2">Next Steps</h3>
                <ul className="space-y-1 text-green-700">
                  <li>• View detailed comparison results</li>
                  <li>• Generate investor reports</li>
                  <li>• Share findings with stakeholders</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('evaluation')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Evaluation
            </button>

            <button
              onClick={handleViewComparison}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              View Investor Comparison →
            </button>
          </div>
        </div>
      )}

      {loading && currentStep !== 'prescreening' && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Saving evaluation results...</span>
          </div>
        </div>
      )}
    </div>
  )
}