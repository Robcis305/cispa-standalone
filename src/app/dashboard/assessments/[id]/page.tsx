'use client';
import { useState, useEffect, useCallback } from 'react';

// Disable static generation for this page since it uses Supabase
export const dynamic = 'force-dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ClockIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { Assessment, Question, Answer, CompanyProfile } from '@/types/database.types';
import CompanyProfileEditor from '@/components/CompanyProfileEditor';

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readinessScore, setReadinessScore] = useState<number>(0);
  const [reasoning, setReasoning] = useState<string>('');
  const [improvements, setImprovements] = useState<string>('');

  useEffect(() => {
    loadAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('assessment_id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Load questions for this assessment
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('module', 'core')
        .eq('is_active', true)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData);

      // Load existing answers
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (answersError) throw answersError;
      setAnswers(answersData);

      // Determine current question
      if (questionsData.length > 0) {
        const answeredQuestionIds = answersData.map(a => a.question_id);
        const nextQuestion = questionsData.find(q => !answeredQuestionIds.includes(q.question_id));
        
        if (nextQuestion) {
          setCurrentQuestion(nextQuestion);
          console.log('Current question:', nextQuestion.question_text, 'Order:', nextQuestion.order_index);
          // Update assessment current_question_id
          await supabase
            .from('assessments')
            .update({ 
              current_question_id: nextQuestion.question_id,
              status: 'in_progress',
              started_at: assessmentData.started_at || new Date().toISOString()
            })
            .eq('assessment_id', assessmentId);
        } else {
          console.log('No more questions - assessment should be complete');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  const submitAnswer = async () => {
    if (!currentQuestion || readinessScore === 0 || !reasoning.trim()) {
      setError('Please provide a readiness score and reasoning');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Temporarily use hardcoded user ID for testing
      const userId = 'b5e19763-d63e-457b-85a6-b0293c9477a7';


      // Save the answer with readiness score and structured data
      console.log('Saving answer for question:', currentQuestion.question_text);
      const answerData = {
        readiness_score: readinessScore,
        reasoning: reasoning,
        improvements: improvements,
        question_text: currentQuestion.question_text,
        dimension: currentQuestion.dimension
      };
      
      const { error: answerError } = await supabase
        .from('answers')
        .insert({
          assessment_id: assessmentId,
          question_id: currentQuestion.question_id,
          answer_value: readinessScore.toString(),
          score_impact: readinessScore,
          answered_by: userId,
          answer_metadata: answerData
        });

      if (answerError) {
        console.error('Answer save error:', answerError);
        throw answerError;
      }
      
      console.log('Answer saved successfully');

      // Find next question
      const answeredQuestionIds = [...answers.map(a => a.question_id), currentQuestion.question_id];
      const nextQuestion = questions.find(q => !answeredQuestionIds.includes(q.question_id));

      if (nextQuestion) {
        // Move to next question
        setCurrentQuestion(nextQuestion);
        setReadinessScore(0);
        setReasoning('');
        setImprovements('');
        
        // Update progress
        const progress = Math.round((answeredQuestionIds.length / questions.length) * 100);
        await supabase
          .from('assessments')
          .update({ 
            current_question_id: nextQuestion.question_id,
            progress_percentage: progress
          })
          .eq('assessment_id', assessmentId);
      } else {
        // Assessment complete
        await completeAssessment();
      }

      // Reload data
      await loadAssessment();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const completeAssessment = async () => {
    try {
      // Calculate final scores here (simplified version)
      const finalAnswers = [...answers];
      const totalScore = finalAnswers.reduce((sum, answer) => sum + (answer.score_impact || 0), 0);
      const maxPossibleScore = questions.length * 6; // Assuming max score of 6 per question
      const overallScore = Math.round((totalScore / maxPossibleScore) * 100);

      // Calculate dimension scores
      const dimensionScores: Record<string, number> = {};
      const dimensionCounts: Record<string, number> = {};
      
      finalAnswers.forEach(answer => {
        const question = questions.find(q => q.question_id === answer.question_id);
        if (question) {
          if (!dimensionScores[question.dimension]) {
            dimensionScores[question.dimension] = 0;
            dimensionCounts[question.dimension] = 0;
          }
          dimensionScores[question.dimension] += answer.score_impact || 0;
          dimensionCounts[question.dimension] += 1;
        }
      });

      // Average dimension scores
      Object.keys(dimensionScores).forEach(dim => {
        dimensionScores[dim] = Math.round((dimensionScores[dim] / dimensionCounts[dim]) * 100 / 6);
      });

      // Update assessment as completed
      await supabase
        .from('assessments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
          overall_readiness_score: overallScore,
          dimension_scores: dimensionScores,
          recommendations: [] // Will be populated by AI in future sprint
        })
        .eq('assessment_id', assessmentId);

      router.push(`/dashboard/assessments/${assessmentId}/results`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        {/* Readiness Score Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Readiness Score (1-5) *
          </label>
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map((score) => (
              <label
                key={score}
                className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  readinessScore === score
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="readiness_score"
                  value={score}
                  checked={readinessScore === score}
                  onChange={() => setReadinessScore(score)}
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
          <p className="text-xs text-gray-500 mt-2">
            Rate the company&apos;s current readiness level for this aspect (1 = Not Ready, 5 = Excellent)
          </p>
        </div>

        {/* Reasoning Section */}
        <div>
          <label htmlFor="reasoning" className="block text-sm font-medium text-gray-700 mb-2">
            Reasoning for Score *
          </label>
          <textarea
            id="reasoning"
            rows={4}
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Explain your reasoning for this readiness score. What factors led to this assessment?"
          />
        </div>

        {/* Suggested Improvements Section */}
        <div>
          <label htmlFor="improvements" className="block text-sm font-medium text-gray-700 mb-2">
            Suggested Improvements
          </label>
          <textarea
            id="improvements"
            rows={4}
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="What specific improvements would you recommend to increase the readiness score?"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Provide actionable recommendations for improvement
          </p>
        </div>
      </div>
    );
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
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment Not Found</h3>
          <p className="text-gray-600 mb-6">{error || "The assessment you're looking for doesn't exist."}</p>
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

  const progress = Math.round((answers.length / questions.length) * 100);
  const isCompleted = assessment.status === 'completed';

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
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assessment Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
              <p className="text-gray-600 mt-1">{assessment.company_name}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                {isCompleted ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                )}
                <span className="text-sm font-medium text-gray-900">
                  {isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {progress}% Complete ({answers.length}/{questions.length} questions)
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {isCompleted ? (
          /* Show assessment overview for completed assessments */
          <div className="space-y-6">
            {/* Company Profile Section */}
            <CompanyProfileEditor
              profile={{
                company_name: assessment.company_name,
                industry: assessment.industry,
                annual_revenue: assessment.annual_revenue,
                funding_amount_sought: assessment.funding_amount_sought,
                investment_type: assessment.investment_type,
                company_stage: assessment.company_stage,
                geographic_location: assessment.geographic_location,
                growth_rate: assessment.growth_rate,
                business_model: assessment.business_model
              }}
              onSave={async (updatedProfile: CompanyProfile) => {
                const { error } = await supabase
                  .from('assessments')
                  .update({
                    company_name: updatedProfile.company_name,
                    industry: updatedProfile.industry,
                    annual_revenue: updatedProfile.annual_revenue,
                    funding_amount_sought: updatedProfile.funding_amount_sought,
                    investment_type: updatedProfile.investment_type,
                    company_stage: updatedProfile.company_stage,
                    geographic_location: updatedProfile.geographic_location,
                    growth_rate: updatedProfile.growth_rate,
                    business_model: updatedProfile.business_model
                  })
                  .eq('assessment_id', assessmentId);

                if (error) {
                  console.error('Error updating company profile:', error);
                  throw error;
                }

                // Update local state
                setAssessment(prev => prev ? {
                  ...prev,
                  ...updatedProfile
                } : null);
              }}
            />

            {/* Assessment Information Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Assessment Title</label>
                  <p className="text-lg text-gray-900">{assessment.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 font-medium">Completed</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Completed Date</label>
                  <p className="text-lg text-gray-900">
                    {assessment.completed_at ? new Date(assessment.completed_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Overall Score</label>
                  <p className="text-2xl font-bold text-blue-600">
                    {assessment.overall_readiness_score || 0}/150
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Questions Answered</label>
                  <p className="text-lg text-gray-900">{answers.length}/{questions.length}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Progress</label>
                  <p className="text-lg text-gray-900">{assessment.progress_percentage}%</p>
                </div>
              </div>
            </div>

            {/* Dimension Scores Overview */}
            {assessment.dimension_scores && typeof assessment.dimension_scores === 'object' && Object.keys(assessment.dimension_scores).length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dimension Scores</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(assessment.dimension_scores).map(([dimension, score]) => {
                    const displayNames: Record<string, string> = {
                      'financial': 'Financial Integrity',
                      'operational': 'Team Capability', 
                      'market': 'Market Positioning',
                      'technology': 'Presentation Quality',
                      'legal': 'Capital Clarity',
                      'strategic': 'Strategic Narrative'
                    };
                    const displayName = displayNames[dimension] || dimension.charAt(0).toUpperCase() + dimension.slice(1);
                    const numericScore = typeof score === 'number' ? score : parseInt(String(score)) || 0;
                    const percentage = Math.round((numericScore / 25) * 100); // Assuming 25 max per dimension
                    
                    return (
                      <div key={dimension} className="border rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">{displayName}</h3>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-gray-900">{numericScore}</span>
                          <span className="text-sm text-gray-500">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              percentage >= 80 ? 'bg-green-500' :
                              percentage >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dimension Scores</h2>
                <p className="text-gray-600">Dimension scores will be available after completing the assessment.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/assessments/${assessmentId}/results`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  View Full Results
                </Link>
                <Link
                  href={`/dashboard/assessments/${assessmentId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Assessment
                </Link>
                <Link
                  href={`/dashboard/assessments/${assessmentId}/investors`}
                  className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Find Investors
                </Link>
              </div>
            </div>
          </div>
        ) : currentQuestion ? (
          /* Show current question */
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                  Question {answers.length + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium text-gray-500 capitalize">
                  {currentQuestion.dimension} Dimension
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {currentQuestion.question_text}
              </h2>
              {currentQuestion.help_text && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                    <p className="ml-2 text-sm text-blue-800">{currentQuestion.help_text}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8">
              {renderQuestionInput()}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={submitAnswer}
                disabled={readinessScore === 0 || !reasoning.trim() || submitting}
                className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving Assessment...' : (answers.length + 1 === questions.length ? 'Complete Assessment' : 'Save & Next Question')}
              </button>
            </div>
          </div>
        ) : (
          /* No more questions - shouldn't happen */
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">No more questions available.</p>
          </div>
        )}
      </div>
    </div>
  );
}