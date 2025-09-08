'use client';
import { useState, useEffect, useCallback } from 'react';

// Disable static generation for this page since it uses Supabase
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  LockClosedIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { Question } from '@/types/database.types';

interface QuestionWithStats extends Question {
  usage_count: number;
  question_category: 'core' | 'optional' | 'custom';
}

const DIMENSIONS = [
  'financial',
  'operational', 
  'market',
  'technology',
  'legal',
  'strategic'
] as const;

const DIMENSION_LABELS = {
  financial: 'Financial',
  operational: 'Operational',
  market: 'Market',
  technology: 'Technology', 
  legal: 'Legal',
  strategic: 'Strategic'
};

const QUESTION_CATEGORIES = {
  core: { 
    label: 'Core Questions', 
    description: 'Essential questions included in every assessment',
    color: 'bg-blue-100 text-blue-800',
    icon: LockClosedIcon
  },
  optional: { 
    label: 'Optional Questions', 
    description: 'Questions that can be added based on company type or situation',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon
  },
  custom: { 
    label: 'Custom Questions', 
    description: 'Company-specific questions created for unique situations',
    color: 'bg-purple-100 text-purple-800',
    icon: PencilIcon
  }
};

export default function QuestionsAdminPage() {
  const [questions, setQuestions] = useState<QuestionWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load questions with usage statistics
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('module', 'core')
        .order('dimension')
        .order('order_index');

      if (questionsError) throw questionsError;

      // Get usage statistics and categorize questions
      const questionsWithStats: QuestionWithStats[] = [];
      
      for (const question of questionsData) {
        const { count, error: countError } = await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('question_id', question.question_id);

        if (countError) {
          console.error('Error getting usage count:', countError);
        }

        // Determine category based on database field and characteristics
        let category: 'core' | 'optional' | 'custom' = 'optional';
        if (question.is_core) {
          category = 'core'; // Use database is_core field
        } else if (question.question_text.toLowerCase().includes('custom') || question.order_index > 50) {
          category = 'custom';
        }

        questionsWithStats.push({
          ...question,
          usage_count: count || 0,
          question_category: category
        });
      }

      setQuestions(questionsWithStats);
      
      // Auto-select all core questions (they're always included)
      const coreQuestionIds = questionsWithStats
        .filter(q => q.question_category === 'core')
        .map(q => q.question_id);
      setSelectedQuestions(new Set(coreQuestionIds));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleQuestionSelection = (questionId: string, isCore: boolean) => {
    if (isCore) return; // Core questions cannot be deselected
    
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const toggleCoreStatus = async (questionId: string, currentCoreStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentCoreStatus ? 'remove this question from' : 'mark this question as'} always included? This will affect all future assessments.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_core: !currentCoreStatus })
        .eq('question_id', questionId);

      if (error) throw error;

      // Update local state
      setQuestions(prev => prev.map(q => 
        q.question_id === questionId 
          ? { ...q, is_core: !currentCoreStatus, question_category: !currentCoreStatus ? 'core' : 'optional' }
          : q
      ));

      // Update selected questions if needed
      if (!currentCoreStatus) {
        // If marking as core, add to selected
        setSelectedQuestions(prev => new Set([...prev, questionId]));
      }
    } catch (err: unknown) {
      alert('Error updating core status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const toggleQuestionStatus = async (questionId: string, currentStatus: boolean, category: string) => {
    if (category === 'core') {
      alert('Core questions cannot be deactivated as they are required for all assessments.');
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: !currentStatus })
        .eq('question_id', questionId);

      if (error) throw error;

      // Update local state
      setQuestions(prev => prev.map(q => 
        q.question_id === questionId 
          ? { ...q, is_active: !currentStatus }
          : q
      ));
    } catch (err: unknown) {
      alert('Error updating question status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const deleteQuestion = async (questionId: string, usageCount: number, category: string) => {
    if (category === 'core') {
      alert('Core questions cannot be deleted as they are essential for assessments.');
      return;
    }

    if (usageCount > 0) {
      alert(`Cannot delete question that has been used in ${usageCount} assessment(s). Deactivate it instead.`);
      return;
    }

    if (!confirm('Are you sure you want to permanently delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('question_id', questionId);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.question_id !== questionId));
    } catch (err: unknown) {
      alert('Error deleting question: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (!showInactive && !q.is_active) return false;
    if (selectedCategory !== 'all' && q.question_category !== selectedCategory) return false;
    if (selectedDimension !== 'all' && q.dimension !== selectedDimension) return false;
    return true;
  });

  const categorySummary = {
    core: questions.filter(q => q.question_category === 'core').length,
    optional: questions.filter(q => q.question_category === 'optional').length,
    custom: questions.filter(q => q.question_category === 'custom').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Questions</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadQuestions}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <Link href="/dashboard" className="flex items-center">
                <img 
                  src="/cis-partners-logo.png" 
                  alt="CIS Partners" 
                  className="h-8 w-auto"
                />
              </Link>
              <span className="text-sm text-gray-500">• Question Management</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assessment Question Builder</h1>
              <p className="text-gray-600 mt-1">
                Select which questions to include in your assessments
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                Selected: <span className="font-semibold text-blue-600">{selectedQuestions.size}</span> questions
              </div>
              <Link
                href="/dashboard/admin/questions/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Optional Question
              </Link>
            </div>
          </div>

          {/* Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(QUESTION_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <div key={key} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center">
                    <Icon className="h-6 w-6 text-gray-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{category.label}</p>
                      <p className="text-xs text-gray-500">{categorySummary[key as keyof typeof categorySummary]} questions</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{category.description}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="core">Core Questions</option>
                  <option value="optional">Optional Questions</option>
                  <option value="custom">Custom Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimension
                </label>
                <select
                  value={selectedDimension}
                  onChange={(e) => setSelectedDimension(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Dimensions</option>
                  {DIMENSIONS.map(dim => (
                    <option key={dim} value={dim}>
                      {DIMENSION_LABELS[dim]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show-inactive"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show-inactive" className="ml-2 text-sm text-gray-700">
                  Show inactive questions
                </label>
              </div>

              <div className="text-sm text-gray-500">
                Showing: {filteredQuestions.length} questions
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => {
            const categoryInfo = QUESTION_CATEGORIES[question.question_category];
            const CategoryIcon = categoryInfo.icon;
            const isCore = question.question_category === 'core';
            const isSelected = selectedQuestions.has(question.question_id);

            return (
              <div key={question.question_id} className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <div className="flex items-center pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleQuestionSelection(question.question_id, isCore)}
                        disabled={isCore}
                        className={`h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                          isCore ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        }`}
                      />
                    </div>

                    {/* Question Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          #{question.order_index}
                        </span>
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {categoryInfo.label.replace(' Questions', '')}
                        </span>

                        <span className="text-xs font-medium text-gray-500 capitalize">
                          {DIMENSION_LABELS[question.dimension as keyof typeof DIMENSION_LABELS] || question.dimension}
                        </span>

                        {isCore && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <LockClosedIcon className="h-3 w-3 mr-1" />
                            Always Included
                          </span>
                        )}
                        
                        {isSelected && !isCore && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      
                      <h3 className={`text-lg font-medium mb-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {question.question_text}
                      </h3>
                      
                      {question.help_text && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
                          <div className="flex">
                            <InformationCircleIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="ml-2 text-sm text-gray-600">{question.help_text}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Type: {question.question_type}</span>
                          <span>Required: {question.is_required ? 'Yes' : 'No'}</span>
                          <span>Used in {question.usage_count} assessments</span>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => toggleCoreStatus(question.question_id, isCore)}
                            className={`p-1 rounded text-xs font-medium px-2 py-1 ${
                              isCore 
                                ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-100 hover:bg-yellow-200'
                                : 'text-gray-400 hover:text-yellow-600 border border-gray-300 hover:border-yellow-400'
                            }`}
                            title={isCore ? 'Remove from always included' : 'Mark as always included'}
                          >
                            {isCore ? '🔒 Core' : '📌 Make Core'}
                          </button>
                          
                          <Link
                            href={`/dashboard/admin/questions/${question.question_id}/edit`}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title={isCore ? 'View question (core questions cannot be edited)' : 'Edit question'}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          
                          {!isCore && (
                            <button
                              onClick={() => deleteQuestion(question.question_id, question.usage_count, question.question_category)}
                              disabled={question.usage_count > 0}
                              className={`p-1 rounded ${
                                question.usage_count > 0
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-600'
                              }`}
                              title={question.usage_count > 0 ? 'Cannot delete used question' : 'Delete question'}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600 mb-6">
              No questions found matching your current filters.
            </p>
            <Link
              href="/dashboard/admin/questions/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Optional Question
            </Link>
          </div>
        )}

        {/* Selection Actions */}
        {filteredQuestions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Selection Summary</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedQuestions.size} questions selected for your assessments
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Core: {questions.filter(q => q.question_category === 'core' && selectedQuestions.has(q.question_id)).length} (always included)</span>
                  <span>Optional: {questions.filter(q => q.question_category === 'optional' && selectedQuestions.has(q.question_id)).length}</span>
                  <span>Custom: {questions.filter(q => q.question_category === 'custom' && selectedQuestions.has(q.question_id)).length}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const optionalAndCustomQuestions = questions.filter(q => q.question_category !== 'core').map(q => q.question_id);
                    const coreQuestions = questions.filter(q => q.question_category === 'core').map(q => q.question_id);
                    setSelectedQuestions(new Set([...coreQuestions, ...optionalAndCustomQuestions]));
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All Optional
                </button>
                
                <button
                  onClick={() => {
                    const coreQuestions = questions.filter(q => q.question_category === 'core').map(q => q.question_id);
                    setSelectedQuestions(new Set(coreQuestions));
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Clear Optional
                </button>
                
                <Link
                  href={`/dashboard/assessments/new?selectedQuestions=${Array.from(selectedQuestions).join(',')}`}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Generate Assessment with Selected Questions
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}