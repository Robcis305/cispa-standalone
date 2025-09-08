'use client'

import { useState } from 'react'
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline'
import { INVESTOR_EVALUATION_CATEGORIES, INVESTOR_EVALUATION_QUESTIONS, type InvestorDimension } from '@/lib/investorEvaluationConstants'

interface InvestorToEvaluate {
  investor_id: string
  name: string
  type: string
  description: string
  website?: string
}

interface EvaluationScore {
  dimension: InvestorDimension
  score: number // 1-10 scale
  notes: string
}

interface CategoryWeight {
  dimension: InvestorDimension
  weight: number // 1-10 scale
}

interface InvestorEvaluationInterfaceProps {
  selectedInvestors: InvestorToEvaluate[]
  onEvaluationComplete: (evaluationResults: Record<string, EvaluationScore[]>) => void
  onBack: () => void
}

type EvaluationStep = 'category_selection' | 'weighting' | 'scoring'

export default function InvestorEvaluationInterface({
  selectedInvestors,
  onEvaluationComplete,
  onBack
}: InvestorEvaluationInterfaceProps) {
  const [currentStep, setCurrentStep] = useState<EvaluationStep>('category_selection')
  const [selectedCategories, setSelectedCategories] = useState<InvestorDimension[]>([])
  const [categoryWeights, setCategoryWeights] = useState<Record<InvestorDimension, number>>({} as Record<InvestorDimension, number>)
  const [evaluationData, setEvaluationData] = useState<Record<string, EvaluationScore[]>>({})
  const [currentInvestorIndex, setCurrentInvestorIndex] = useState(0)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)

  const steps = [
    { id: 'category_selection', title: 'Select Categories', description: 'Choose evaluation criteria' },
    { id: 'weighting', title: 'Set Weights', description: 'Assign importance levels' },
    { id: 'scoring', title: 'Score Investors', description: 'Rate each investor' }
  ]

  const handleCategoryToggle = (category: InvestorDimension) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleCategorySelectionComplete = () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one evaluation category.')
      return
    }
    // Initialize weights with default values
    const initialWeights = selectedCategories.reduce((acc, category) => {
      acc[category] = INVESTOR_EVALUATION_CATEGORIES[category].weight
      return acc
    }, {} as Record<InvestorDimension, number>)
    setCategoryWeights(initialWeights)
    setCurrentStep('weighting')
  }

  const handleWeightChange = (category: InvestorDimension, weight: number) => {
    setCategoryWeights(prev => ({
      ...prev,
      [category]: weight
    }))
  }

  const handleWeightingComplete = () => {
    // Initialize evaluation data structure
    const initialEvalData = selectedInvestors.reduce((acc, investor) => {
      acc[investor.investor_id] = selectedCategories.map(category => ({
        dimension: category,
        score: 5,
        notes: ''
      }))
      return acc
    }, {} as Record<string, EvaluationScore[]>)
    setEvaluationData(initialEvalData)
    setCurrentStep('scoring')
  }

  const handleScoreChange = (investorId: string, categoryIndex: number, field: 'score' | 'notes', value: string | number) => {
    setEvaluationData(prev => ({
      ...prev,
      [investorId]: prev[investorId].map((score, idx) => 
        idx === categoryIndex 
          ? { ...score, [field]: value }
          : score
      )
    }))
  }

  const handleNextInvestor = () => {
    if (currentInvestorIndex < selectedInvestors.length - 1) {
      setCurrentInvestorIndex(prev => prev + 1)
    } else {
      // All investors evaluated - complete the process
      onEvaluationComplete(evaluationData)
    }
  }

  const handlePreviousInvestor = () => {
    if (currentInvestorIndex > 0) {
      setCurrentInvestorIndex(prev => prev - 1)
    }
  }

  const currentInvestor = selectedInvestors[currentInvestorIndex]
  const currentInvestorScores = evaluationData[currentInvestor?.investor_id] || []

  if (currentStep === 'category_selection') {
    return (
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index
            
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
                    index + 1
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

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Select Evaluation Categories
            </h2>
            <p className="text-gray-600">
              Choose the criteria you want to use for evaluating investors. Select {selectedCategories.length} of 17 available categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(INVESTOR_EVALUATION_CATEGORIES).map(([key, category]) => (
              <div
                key={key}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedCategories.includes(key as InvestorDimension)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleCategoryToggle(key as InvestorDimension)}
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(key as InvestorDimension)}
                    onChange={() => handleCategoryToggle(key as InvestorDimension)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {INVESTOR_EVALUATION_QUESTIONS[key as InvestorDimension]?.length || 0} questions
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Selection
            </button>
            
            <div className="text-sm text-gray-600">
              {selectedCategories.length} categories selected
            </div>

            <button
              onClick={handleCategorySelectionComplete}
              disabled={selectedCategories.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Weights →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'weighting') {
    return (
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index
            
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
                    index + 1
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

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Assign Category Weights
            </h2>
            <p className="text-gray-600">
              Set the importance level for each selected category (1-10 scale). Higher weights mean more influence on the final comparison.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {selectedCategories.map((category) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {INVESTOR_EVALUATION_CATEGORIES[category].name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {INVESTOR_EVALUATION_QUESTIONS[category]?.length || 0} evaluation questions
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      {categoryWeights[category]}/10
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-16">Low (1)</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={categoryWeights[category] || 5}
                    onChange={(e) => handleWeightChange(category, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 w-16">High (10)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep('category_selection')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Categories
            </button>
            
            <div className="text-sm text-gray-600">
              Total weight: {Object.values(categoryWeights).reduce((sum, weight) => sum + weight, 0)}
            </div>

            <button
              onClick={handleWeightingComplete}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Scoring →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'scoring') {
    return (
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index
            
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
                    index + 1
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

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Score Investor: {currentInvestor.name}
                </h2>
                <p className="text-gray-600">
                  Rate this investor on each selected category (1-10 scale).
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Investor {currentInvestorIndex + 1} of {selectedInvestors.length}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${((currentInvestorIndex + 1) / selectedInvestors.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-6">
            {currentInvestorScores.map((score, categoryIndex) => {
              const category = selectedCategories[categoryIndex]
              const categoryInfo = INVESTOR_EVALUATION_CATEGORIES[category]
              const questions = INVESTOR_EVALUATION_QUESTIONS[category] || []
              
              return (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {categoryInfo.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          Weight: {categoryWeights[category]}/10
                        </span>
                        <div className="text-lg font-semibold text-blue-600">
                          {score.score}/10
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Sample questions to consider:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {questions.slice(0, 3).map((question, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            {question}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-sm text-gray-500 w-16">Poor (1)</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={score.score}
                        onChange={(e) => handleScoreChange(currentInvestor.investor_id, categoryIndex, 'score', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-500 w-20">Excellent (10)</span>
                    </div>

                    <textarea
                      placeholder="Notes and reasoning for this score..."
                      value={score.notes}
                      onChange={(e) => handleScoreChange(currentInvestor.investor_id, categoryIndex, 'notes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={currentInvestorIndex === 0 ? () => setCurrentStep('weighting') : handlePreviousInvestor}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {currentInvestorIndex === 0 ? 'Back to Weights' : 'Previous Investor'}
            </button>

            <button
              onClick={handleNextInvestor}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {currentInvestorIndex < selectedInvestors.length - 1 ? 'Next Investor →' : 'Complete Evaluation →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}