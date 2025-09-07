'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ClockIcon,
  DocumentTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { Assessment, Question, Answer } from '@/types/database.types';

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
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [readinessScore, setReadinessScore] = useState<number>(0);
  const [reasoning, setReasoning] = useState<string>('');
  const [improvements, setImprovements] = useState<string>('');

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const loadAssessment = async () => {
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      // Calculate score impact based on question type and answer
      let scoreImpact = 0;
      if (currentQuestion.question_type === 'scale' && currentQuestion.options) {
        const option = currentQuestion.options.find((opt: any) => opt.value === currentAnswer);
        scoreImpact = option ? option.score : 0;
      } else if (currentQuestion.question_type === 'multiple_choice' && currentQuestion.options) {
        const option = currentQuestion.options.find((opt: any) => opt.value === currentAnswer);
        scoreImpact = option ? option.score : 0;
      } else if (currentQuestion.question_type === 'boolean') {
        scoreImpact = currentAnswer === 'true' ? 5 : 1;
      } else if (currentQuestion.question_type === 'number') {
        // Simple scoring for number questions - can be made more sophisticated
        const numValue = parseFloat(currentAnswer) || 0;
        scoreImpact = Math.min(Math.max(numValue / 1000000, 1), 6); // Scale revenue to 1-6
      } else {
        scoreImpact = 3; // Default neutral score for text answers
      }

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
        setCurrentAnswer('');
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
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
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
            Rate the company's current readiness level for this aspect (1 = Not Ready, 5 = Excellent)
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
          <p className="text-gray-600 mb-6">{error || 'The assessment you\'re looking for doesn\'t exist.'}</p>
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
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                CISPA Platform
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
          /* Show completion message */
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your transaction readiness assessment has been completed. View your results and recommendations.
            </p>
            <Link
              href={`/dashboard/assessments/${assessmentId}/results`}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              View Results
            </Link>
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