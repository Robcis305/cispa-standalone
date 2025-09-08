'use client';
import { useState, useEffect, useCallback } from 'react';

// Disable static generation for this page since it uses Supabase
export const dynamic = 'force-dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { Assessment, Question, Answer } from '@/types/database.types';

interface QuestionWithAnswer extends Question {
  answer: Answer | null;
  currentScore: number;
  currentReasoning: string;
  currentImprovements: string;
}

export default function EditAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAssessmentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const loadAssessmentData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('assessment_id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      
      if (assessmentData.status !== 'completed') {
        router.push(`/dashboard/assessments/${assessmentId}`);
        return;
      }
      
      setAssessment(assessmentData);

      // Load questions with answers
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('module', 'core')
        .eq('is_active', true)
        .order('order_index');

      if (questionsError) throw questionsError;

      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (answersError) throw answersError;

      // Combine questions with their answers
      const questionsWithAnswers: QuestionWithAnswer[] = questionsData.map(question => {
        const answer = answersData.find(a => a.question_id === question.question_id);
        return {
          ...question,
          answer,
          currentScore: answer?.score_impact || 1,
          currentReasoning: answer?.answer_metadata?.reasoning || '',
          currentImprovements: answer?.answer_metadata?.improvements || ''
        };
      });

      setQuestions(questionsWithAnswers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [assessmentId, router]);

  const updateQuestionScore = (questionId: string, field: 'score' | 'reasoning' | 'improvements', value: string | number) => {
    setQuestions(prev => prev.map(q => {
      if (q.question_id === questionId) {
        const updated = { ...q };
        if (field === 'score') updated.currentScore = Number(value);
        else if (field === 'reasoning') updated.currentReasoning = String(value);
        else if (field === 'improvements') updated.currentImprovements = String(value);
        return updated;
      }
      return q;
    }));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!assessment) return;

    setSaving(true);
    setError(null);

    try {
      const userId = 'b5e19763-d63e-457b-85a6-b0293c9477a7'; // Temporary hardcoded user ID

      // Update all answers
      for (const question of questions) {
        const answerData = {
          readiness_score: question.currentScore,
          reasoning: question.currentReasoning,
          improvements: question.currentImprovements,
          question_text: question.question_text,
          dimension: question.dimension
        };

        if (question.answer) {
          // Update existing answer
          await supabase
            .from('answers')
            .update({
              answer_value: question.currentScore.toString(),
              score_impact: question.currentScore,
              answer_metadata: answerData,
              updated_at: new Date().toISOString()
            })
            .eq('answer_id', question.answer.answer_id);
        } else {
          // Create new answer (shouldn't happen for completed assessments)
          await supabase
            .from('answers')
            .insert({
              assessment_id: assessmentId,
              question_id: question.question_id,
              answer_value: question.currentScore.toString(),
              score_impact: question.currentScore,
              answered_by: userId,
              answer_metadata: answerData
            });
        }
      }

      // Recalculate dimension scores
      const dimensions = ['financial', 'operational', 'market', 'technology', 'legal', 'strategic'];
      const dimensionScores: Record<string, number> = {};
      const dimensionCounts: Record<string, number> = {};
      
      questions.forEach(question => {
        if (!dimensionScores[question.dimension]) {
          dimensionScores[question.dimension] = 0;
          dimensionCounts[question.dimension] = 0;
        }
        dimensionScores[question.dimension] += question.currentScore;
        dimensionCounts[question.dimension] += 1;
      });

      // Average dimension scores and convert to percentage
      Object.keys(dimensionScores).forEach(dim => {
        dimensionScores[dim] = Math.round((dimensionScores[dim] / dimensionCounts[dim]) * 100 / 6);
      });

      // Calculate overall score
      const totalScore = questions.reduce((sum, q) => sum + q.currentScore, 0);
      const maxPossibleScore = questions.length * 6;
      const overallScore = Math.round((totalScore / maxPossibleScore) * 100);

      // Update assessment with new scores
      await supabase
        .from('assessments')
        .update({
          overall_readiness_score: overallScore,
          dimension_scores: dimensionScores,
          updated_at: new Date().toISOString()
        })
        .eq('assessment_id', assessmentId);

      setHasChanges(false);
      router.push(`/dashboard/assessments/${assessmentId}/results`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const rerunAssessment = async () => {
    if (!confirm('This will reset the assessment to allow fresh answers. All current answers will be preserved as history. Continue?')) {
      return;
    }

    try {
      setSaving(true);
      
      // Reset assessment status to in_progress and clear current_question_id
      await supabase
        .from('assessments')
        .update({
          status: 'in_progress',
          current_question_id: questions[0]?.question_id || null,
          progress_percentage: 0,
          updated_at: new Date().toISOString()
        })
        .eq('assessment_id', assessmentId);

      // Redirect to assessment page to start fresh
      router.push(`/dashboard/assessments/${assessmentId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset assessment');
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-500 mb-4">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Edit Assessment</h3>
          <p className="text-gray-600 mb-6">{error || "The assessment you're trying to edit is not available."}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
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
                href={`/dashboard/assessments/${assessmentId}/results`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Results
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <Link href="/dashboard" className="flex items-center">
                <img 
                  src="/cis-partners-logo.png" 
                  alt="CIS Partners" 
                  className="h-8 w-auto"
                />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Assessment</h1>
              <p className="text-gray-600 mt-1">{assessment.title} • {assessment.company_name}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={rerunAssessment}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Re-run Assessment
              </button>
              <button
                onClick={saveChanges}
                disabled={saving || !hasChanges}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {hasChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                <p className="ml-2 text-sm text-yellow-800">
                  You have unsaved changes. Click "Save Changes" to update the assessment and recalculate scores.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                <p className="ml-2 text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.question_id} className="bg-white rounded-lg shadow-sm border">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleQuestionExpanded(question.question_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Question {index + 1}
                      </span>
                      <span className="text-xs font-medium text-gray-500 capitalize">
                        {question.dimension} Dimension
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {question.question_text}
                    </h3>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm text-gray-500">Current Score:</span>
                    <div className="text-lg font-bold text-blue-600">
                      {question.currentScore}/5
                    </div>
                  </div>
                </div>
              </div>

              {expandedQuestions.has(question.question_id) && (
                <div className="border-t bg-gray-50 p-6">
                  {question.help_text && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                      <div className="flex">
                        <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                        <p className="ml-2 text-sm text-blue-800">{question.help_text}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Score Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Readiness Score (1-5)
                      </label>
                      <div className="flex space-x-4">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <label
                            key={score}
                            className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              question.currentScore === score
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`score_${question.question_id}`}
                              value={score}
                              checked={question.currentScore === score}
                              onChange={() => updateQuestionScore(question.question_id, 'score', score)}
                              className="sr-only"
                            />
                            <span className="text-2xl font-bold text-gray-900 mb-1">{score}</span>
                            <span className="text-xs text-center text-gray-600">
                              {score === 1 ? 'Not Ready' : 
                               score === 2 ? 'Poor' : 
                               score === 3 ? 'Fair' : 
                               score === 4 ? 'Good' : 
                               'Excellent'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div>
                      <label htmlFor={`reasoning_${question.question_id}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Reasoning for Score
                      </label>
                      <textarea
                        id={`reasoning_${question.question_id}`}
                        rows={4}
                        value={question.currentReasoning}
                        onChange={(e) => updateQuestionScore(question.question_id, 'reasoning', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Explain your reasoning for this readiness score..."
                      />
                    </div>

                    {/* Improvements */}
                    <div>
                      <label htmlFor={`improvements_${question.question_id}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Suggested Improvements
                      </label>
                      <textarea
                        id={`improvements_${question.question_id}`}
                        rows={4}
                        value={question.currentImprovements}
                        onChange={(e) => updateQuestionScore(question.question_id, 'improvements', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="What specific improvements would you recommend?"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end space-x-4">
          <Link
            href={`/dashboard/assessments/${assessmentId}/results`}
            className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            onClick={saveChanges}
            disabled={saving || !hasChanges}
            className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}