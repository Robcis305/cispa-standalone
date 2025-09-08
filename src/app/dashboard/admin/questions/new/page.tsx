'use client';
import { useState } from 'react';

// Disable static generation for this page since it uses Supabase
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

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
  is_required: boolean;
  question_category: 'optional' | 'custom';
}

export default function NewQuestionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: '',
    dimension: '',
    question_type: 'scale',
    help_text: '',
    is_required: true,
    question_category: 'optional'
  });

  const updateFormData = (field: keyof QuestionFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveQuestion = async () => {
    if (!formData.question_text.trim() || !formData.dimension) {
      setError('Question text and dimension are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Get the next order index for this dimension
      const { data: existingQuestions, error: orderError } = await supabase
        .from('questions')
        .select('order_index')
        .eq('dimension', formData.dimension)
        .eq('module', 'core')
        .order('order_index', { ascending: false })
        .limit(1);

      if (orderError) throw orderError;

      const nextOrderIndex = existingQuestions.length > 0 
        ? (existingQuestions[0].order_index + 1)
        : 1;

      // Create the question
      const questionData = {
        question_text: formData.question_text.trim(),
        question_type: formData.question_type as any,
        dimension: formData.dimension as any,
        module: 'core' as const,
        order_index: nextOrderIndex,
        weight: 1, // Standard weight for all questions
        scoring_impact: 1, // Standard scoring impact
        help_text: formData.help_text.trim() || null,
        is_required: formData.is_required,
        is_active: true,
        branching_conditions: null,
        options: formData.question_type === 'scale' ? [
          { label: 'Not Ready', value: '1', score: 1 },
          { label: 'Poor', value: '2', score: 2 },
          { label: 'Fair', value: '3', score: 3 },
          { label: 'Good', value: '4', score: 4 },
          { label: 'Excellent', value: '5', score: 5 }
        ] : [],
        validation_rules: null
      };

      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionData);

      if (insertError) throw insertError;

      router.push('/dashboard/admin/questions');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

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
              <span className="text-sm text-gray-500">• Add Question</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Question</h1>
          <p className="text-gray-600 mt-1">
            Create a new question for Transaction Readiness Assessments
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
              <p className="ml-2 text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

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
            </div>

            {/* Question Category */}
            <div>
              <label htmlFor="question_category" className="block text-sm font-medium text-gray-700 mb-2">
                Question Category
              </label>
              <select
                id="question_category"
                value={formData.question_category}
                onChange={(e) => updateFormData('question_category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="optional">Optional Question</option>
                <option value="custom">Custom Question</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {formData.question_category === 'optional' 
                  ? 'Can be added to assessments based on company type or situation'
                  : 'Company-specific question for unique situations'
                }
              </p>
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

            {/* Preview */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Question Preview
                  </span>
                  {formData.dimension && (
                    <span className="text-xs font-medium text-gray-500 capitalize">
                      {DIMENSIONS.find(d => d.value === formData.dimension)?.label} Dimension
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
              onClick={saveQuestion}
              disabled={saving || !formData.question_text.trim() || !formData.dimension}
              className="px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving Question...' : 'Save Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}