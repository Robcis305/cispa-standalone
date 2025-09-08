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
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { Question } from '@/types/database.types';

const DIMENSIONS = [
  { value: 'financial', label: 'Financial' },
  { value: 'operational', label: 'Operational' },
  { value: 'market', label: 'Market' },
  { value: 'technology', label: 'Technology' },
  { value: 'legal', label: 'Legal' },
  { value: 'strategic', label: 'Strategic' }
];

const QUESTION_TYPES = [
  { value: 'scale', label: 'Scale (1-5 rating)', description: 'Standard readiness assessment scale' },
  { value: 'boolean', label: 'Yes/No', description: 'Simple boolean question' },
  { value: 'multiple_choice', label: 'Multiple Choice', description: 'Select from predefined options' },
  { value: 'text', label: 'Text', description: 'Free text input' },
  { value: 'number', label: 'Number', description: 'Numeric input' }
];

interface QuestionFormData {
  question_text: string;
  dimension: string;
  question_type: string;
  help_text: string;
  weight: number;
  scoring_impact: number;
  is_required: boolean;
  is_active: boolean;
}

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: '',
    dimension: '',
    question_type: 'scale',
    help_text: '',
    weight: 1,
    scoring_impact: 1,
    is_required: true,
    is_active: true
  });

  useEffect(() => {
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load question
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('question_id', questionId)
        .single();

      if (questionError) throw questionError;
      setQuestion(questionData);

      // Get usage count
      const { count, error: countError } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', questionId);

      if (countError) {
        console.error('Error getting usage count:', countError);
      }
      setUsageCount(count || 0);

      // Set form data
      setFormData({
        question_text: questionData.question_text,
        dimension: questionData.dimension,
        question_type: questionData.question_type,
        help_text: questionData.help_text || '',
        weight: questionData.weight,
        scoring_impact: questionData.scoring_impact,
        is_required: questionData.is_required,
        is_active: questionData.is_active
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  const updateFormData = (field: keyof QuestionFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!formData.question_text.trim() || !formData.dimension) {
      setError('Question text and dimension are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updateData = {
        question_text: formData.question_text.trim(),
        question_type: formData.question_type as any,
        dimension: formData.dimension as any,
        weight: formData.weight,
        scoring_impact: formData.scoring_impact,
        help_text: formData.help_text.trim() || null,
        is_required: formData.is_required,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('questions')
        .update(updateData)
        .eq('question_id', questionId);

      if (updateError) throw updateError;

      setHasChanges(false);
      router.push('/dashboard/admin/questions');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-500 mb-4">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Question Not Found</h3>
          <p className="text-gray-600 mb-6">{error || 'The question you\'re trying to edit does not exist.'}</p>
          <Link
            href="/dashboard/admin/questions"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Questions
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
                href="/dashboard/admin/questions"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Questions
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                CISPA Platform
              </Link>
              <span className="text-sm text-gray-500">• Edit Question</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Question</h1>
              <p className="text-gray-600 mt-1">
                Question #{question.order_index} • {DIMENSIONS.find(d => d.value === question.dimension)?.label} Dimension
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Used in {usageCount} assessment{usageCount !== 1 ? 's' : ''}
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                formData.is_active 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {formData.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          {hasChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                <p className="ml-2 text-sm text-yellow-800">
                  You have unsaved changes. Click "Save Changes" to update the question.
                </p>
              </div>
            </div>
          )}

          {usageCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <p className="ml-2 text-sm text-blue-800">
                  This question has been used in {usageCount} assessment{usageCount !== 1 ? 's' : ''}. 
                  Changes will affect new assessments but won't modify existing ones.
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

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            {/* Question Text */}
            <div>
              <label htmlFor="question_text" className="block text-sm font-medium text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                id="question_text"
                rows={3}
                value={formData.question_text}
                onChange={(e) => updateFormData('question_text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the question text that users will see..."
              />
            </div>

            {/* Dimension */}
            <div>
              <label htmlFor="dimension" className="block text-sm font-medium text-gray-700 mb-2">
                Dimension *
              </label>
              <select
                id="dimension"
                value={formData.dimension}
                onChange={(e) => updateFormData('dimension', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select dimension...</option>
                {DIMENSIONS.map(dim => (
                  <option key={dim.value} value={dim.value}>
                    {dim.label}
                  </option>
                ))}
              </select>
              {usageCount > 0 && formData.dimension !== question.dimension && (
                <p className="mt-1 text-sm text-yellow-600">
                  ⚠️ Changing dimension will affect how this question is categorized in reports
                </p>
              )}
            </div>

            {/* Question Type */}
            <div>
              <label htmlFor="question_type" className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                id="question_type"
                value={formData.question_type}
                onChange={(e) => updateFormData('question_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {QUESTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {QUESTION_TYPES.find(t => t.value === formData.question_type)?.description}
              </p>
              {usageCount > 0 && formData.question_type !== question.question_type && (
                <p className="mt-1 text-sm text-yellow-600">
                  ⚠️ Changing question type may affect how existing answers are interpreted
                </p>
              )}
            </div>

            {/* Help Text */}
            <div>
              <label htmlFor="help_text" className="block text-sm font-medium text-gray-700 mb-2">
                Help Text
              </label>
              <textarea
                id="help_text"
                rows={2}
                value={formData.help_text}
                onChange={(e) => updateFormData('help_text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional help text to provide additional context or guidance..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weight */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                  Weight
                </label>
                <input
                  type="number"
                  id="weight"
                  min="1"
                  max="10"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Relative importance in scoring (1-10)
                </p>
              </div>

              {/* Scoring Impact */}
              <div>
                <label htmlFor="scoring_impact" className="block text-sm font-medium text-gray-700 mb-2">
                  Scoring Impact
                </label>
                <input
                  type="number"
                  id="scoring_impact"
                  min="1"
                  max="10"
                  value={formData.scoring_impact}
                  onChange={(e) => updateFormData('scoring_impact', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Impact multiplier on overall score
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Required */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={formData.is_required}
                  onChange={(e) => updateFormData('is_required', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_required" className="ml-2 text-sm text-gray-700">
                  This question is required
                </label>
              </div>

              {/* Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => updateFormData('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Question is active (appears in new assessments)
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Question #{question.order_index}
                  </span>
                  {formData.dimension && (
                    <span className="text-xs font-medium text-gray-500 capitalize">
                      {DIMENSIONS.find(d => d.value === formData.dimension)?.label} Dimension
                    </span>
                  )}
                  {!formData.is_active && (
                    <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {formData.question_text || 'Question text will appear here...'}
                </h4>
                
                {formData.help_text && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <InformationCircleIcon className="h-4 w-4 text-blue-400 mt-0.5" />
                      <p className="ml-2 text-sm text-blue-800">{formData.help_text}</p>
                    </div>
                  </div>
                )}

                {formData.question_type === 'scale' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Readiness Score (1-5) {formData.is_required && '*'}
                    </label>
                    <div className="flex space-x-4">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <div
                          key={score}
                          className="flex flex-col items-center p-3 border border-gray-200 rounded-lg cursor-not-allowed opacity-50"
                        >
                          <span className="text-2xl font-bold text-gray-900 mb-1">{score}</span>
                          <span className="text-xs text-center text-gray-600">
                            {score === 1 ? 'Not Ready' : 
                             score === 2 ? 'Poor' : 
                             score === 3 ? 'Fair' : 
                             score === 4 ? 'Good' : 
                             'Excellent'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-4">
            <Link
              href="/dashboard/admin/questions"
              className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              onClick={saveChanges}
              disabled={saving || !hasChanges || !formData.question_text.trim() || !formData.dimension}
              className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}