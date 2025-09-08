'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import InvestorWorkflow from '@/components/investor/InvestorWorkflow'
import InvestorComparisonView from './InvestorComparisonView'

type ViewMode = 'workflow' | 'comparison'

export default function InvestorMatchingPage() {
  const params = useParams()
  const assessmentId = params.id as string
  
  const [viewMode, setViewMode] = useState<ViewMode>('workflow')
  const [workflowResults, setWorkflowResults] = useState<any>(null)

  const handleWorkflowComplete = (results: any) => {
    setWorkflowResults(results)
    setViewMode('comparison')
  }

  const handleBackToWorkflow = () => {
    setViewMode('workflow')
  }

  if (viewMode === 'comparison' && workflowResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href={`/dashboard/assessments/${assessmentId}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Back to Assessment
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <button
                onClick={handleBackToWorkflow}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ChartBarIcon className="h-5 w-5" />
                Back to Workflow
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Investor Comparison Results
            </h1>
          </div>

          <InvestorComparisonView assessmentId={assessmentId} />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href={`/dashboard/assessments/${assessmentId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Assessment
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Investor Matching & Evaluation
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Three-Step Investor Evaluation Process
            </h2>
            <p className="text-gray-600">
              Our comprehensive investor evaluation process helps you find and assess the best investment partners 
              for your company through systematic pre-screening, selection, and detailed evaluation.
            </p>
          </div>

          <InvestorWorkflow
            assessmentId={assessmentId}
            onComplete={handleWorkflowComplete}
            onBack={() => window.history.back()}
          />
        </div>
      </div>
    </div>
  )
}