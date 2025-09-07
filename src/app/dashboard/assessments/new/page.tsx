'use client';
import { useState } from 'react';

// Disable static generation for this page since it uses Supabase
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface AssessmentTemplate {
  id: string;
  title: string;
  description: string;
  duration: string;
  questions: number;
  category: string;
}

export default function NewAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    template: '',
    timeline: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  const templates: AssessmentTemplate[] = [
    {
      id: 'transaction_readiness',
      title: 'Transaction Readiness Assessment',
      description: 'Comprehensive evaluation of company readiness for M&A transactions',
      duration: '1-2 hours',
      questions: 45,
      category: 'M&A'
    },
    {
      id: 'compliance_audit',
      title: 'Compliance Audit',
      description: 'Review compliance with regulatory requirements and internal policies',
      duration: '45-90 minutes',
      questions: 35,
      category: 'Compliance'
    },
    {
      id: 'operational_review',
      title: 'Operational Review',
      description: 'Assessment of operational efficiency and process optimization',
      duration: '1 hour',
      questions: 30,
      category: 'Operations'
    },
    {
      id: 'custom',
      title: 'Custom Assessment',
      description: 'Build a custom assessment tailored to your specific needs',
      duration: 'Variable',
      questions: 0,
      category: 'Custom'
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createAssessment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Temporarily use hardcoded advisor ID for testing
      const advisorId = 'b5e19763-d63e-457b-85a6-b0293c9477a7';

      // Create the assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          title: formData.title,
          description: formData.description || null,
          company_name: formData.companyName,
          advisor_id: advisorId,
          template_type: formData.template,
          priority: formData.priority,
          timeline: formData.timeline,
          status: 'draft'
        })
        .select()
        .single();

      if (assessmentError) {
        throw assessmentError;
      }

      // Redirect to the assessment
      router.push(`/dashboard/assessments/${assessment.assessment_id}`);
    } catch (err: unknown) {
      console.error('Error creating assessment:', err);
      setError((err instanceof Error ? err.message : 'An unknown error occurred') || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      createAssessment();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      router.push('/dashboard');
    }
  };

  const isStepValid = () => {
    if (step === 1) {
      return formData.title && formData.companyName && formData.template;
    }
    if (step === 2) {
      return formData.timeline && formData.priority;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
              </button>
              <div className="h-6 border-l border-gray-300" />
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                CISPA Platform
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className="text-sm font-medium ml-2 text-gray-900">Assessment Details</div>
            </div>
            <div className={`w-24 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className="text-sm font-medium ml-2 text-gray-900">Configuration</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {step === 1 && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create New Assessment</h1>
                <p className="mt-2 text-gray-600">
                  Set up your assessment details and choose a template to get started.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Assessment Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Q4 2024 Transaction Readiness"
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Acme Corporation"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional description of this assessment..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Assessment Template *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`relative border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.template === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleInputChange('template', template.id)}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="template"
                            value={template.id}
                            checked={formData.template === template.id}
                            onChange={() => handleInputChange('template', template.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="ml-3 flex-1">
                            <label className="font-medium text-gray-900 cursor-pointer">
                              {template.title}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                              <span>{template.duration}</span>
                              <span>•</span>
                              <span>{template.questions > 0 ? `${template.questions} questions` : 'Custom'}</span>
                              <span>•</span>
                              <span>{template.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Assessment Configuration</h1>
                <p className="mt-2 text-gray-600">
                  Configure timeline and priority settings for your assessment.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Completion Timeline *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['1 week', '2 weeks', '1 month'].map((timeline) => (
                      <div
                        key={timeline}
                        className={`border-2 rounded-lg p-4 cursor-pointer text-center transition-colors ${
                          formData.timeline === timeline
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleInputChange('timeline', timeline)}
                      >
                        <input
                          type="radio"
                          name="timeline"
                          value={timeline}
                          checked={formData.timeline === timeline}
                          onChange={() => handleInputChange('timeline', timeline)}
                          className="sr-only"
                        />
                        <div className="font-medium text-gray-900">{timeline}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority Level *
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>Assessment:</strong> {formData.title}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>Company:</strong> {formData.companyName}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Template:</strong> {templates.find(t => t.id === formData.template)?.title}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Timeline:</strong> {formData.timeline} • <strong>Priority:</strong> {formData.priority}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : (step === 1 ? 'Next' : 'Create Assessment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}