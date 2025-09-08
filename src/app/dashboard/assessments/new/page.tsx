'use client';
import { useState, useEffect, Suspense } from 'react';

// Disable static generation for this page since it uses Supabase
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

function NewAssessmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    template: '',
    timeline: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    // Company profile for investor matching
    industry: '',
    annualRevenue: '',
    fundingAmountSought: '',
    investmentType: '' as '' | 'control' | 'minority' | 'either',
    companyStage: '' as '' | 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'late_stage',
    geographicLocation: '',
    growthRate: '',
    businessModel: '' as '' | 'b2b_saas' | 'b2c' | 'marketplace' | 'hardware' | 'biotech' | 'fintech' | 'other',
    ebitda: ''
  });

  useEffect(() => {
    // Get selected questions from URL parameters
    const questionsParam = searchParams.get('selectedQuestions');
    if (questionsParam) {
      setSelectedQuestions(questionsParam.split(','));
    }
  }, [searchParams]);

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

      // Store company profile data in localStorage temporarily until database schema is updated
      const companyProfile = {
        industry: formData.industry,
        annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : null,
        fundingAmountSought: formData.fundingAmountSought ? parseFloat(formData.fundingAmountSought) : null,
        investmentType: formData.investmentType,
        companyStage: formData.companyStage,
        geographicLocation: formData.geographicLocation,
        growthRate: formData.growthRate ? parseFloat(formData.growthRate) : null,
        businessModel: formData.businessModel,
        ebitda: formData.ebitda ? parseFloat(formData.ebitda) : null
      };
      localStorage.setItem(`companyProfile_${assessment.assessment_id}`, JSON.stringify(companyProfile));

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

                {/* Company Profile Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Company Profile (For Investor Matching)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                        Industry
                      </label>
                      <input
                        type="text"
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Technology, Healthcare, Finance"
                      />
                    </div>

                    <div>
                      <label htmlFor="companyStage" className="block text-sm font-medium text-gray-700">
                        Company Stage
                      </label>
                      <select
                        id="companyStage"
                        value={formData.companyStage}
                        onChange={(e) => handleInputChange('companyStage', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select stage...</option>
                        <option value="pre_seed">Pre-Seed</option>
                        <option value="seed">Seed</option>
                        <option value="series_a">Series A</option>
                        <option value="series_b">Series B</option>
                        <option value="series_c">Series C</option>
                        <option value="growth">Growth</option>
                        <option value="late_stage">Late Stage</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="annualRevenue" className="block text-sm font-medium text-gray-700">
                        Annual Revenue ($)
                      </label>
                      <input
                        type="number"
                        id="annualRevenue"
                        value={formData.annualRevenue}
                        onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1000000"
                      />
                    </div>

                    <div>
                      <label htmlFor="fundingAmountSought" className="block text-sm font-medium text-gray-700">
                        Funding Amount Sought ($)
                      </label>
                      <input
                        type="number"
                        id="fundingAmountSought"
                        value={formData.fundingAmountSought}
                        onChange={(e) => handleInputChange('fundingAmountSought', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="5000000"
                      />
                    </div>

                    <div>
                      <label htmlFor="investmentType" className="block text-sm font-medium text-gray-700">
                        Investment Type
                      </label>
                      <select
                        id="investmentType"
                        value={formData.investmentType}
                        onChange={(e) => handleInputChange('investmentType', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select type...</option>
                        <option value="control">Control</option>
                        <option value="minority">Minority</option>
                        <option value="either">Either</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="businessModel" className="block text-sm font-medium text-gray-700">
                        Business Model
                      </label>
                      <select
                        id="businessModel"
                        value={formData.businessModel}
                        onChange={(e) => handleInputChange('businessModel', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select model...</option>
                        <option value="b2b_saas">B2B SaaS</option>
                        <option value="b2c">B2C</option>
                        <option value="marketplace">Marketplace</option>
                        <option value="hardware">Hardware</option>
                        <option value="biotech">Biotech</option>
                        <option value="fintech">Fintech</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="geographicLocation" className="block text-sm font-medium text-gray-700">
                        Geographic Location
                      </label>
                      <input
                        type="text"
                        id="geographicLocation"
                        value={formData.geographicLocation}
                        onChange={(e) => handleInputChange('geographicLocation', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., San Francisco, New York, London"
                      />
                    </div>

                    <div>
                      <label htmlFor="growthRate" className="block text-sm font-medium text-gray-700">
                        Growth Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        id="growthRate"
                        value={formData.growthRate}
                        onChange={(e) => handleInputChange('growthRate', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="25"
                      />
                    </div>

                    <div>
                      <label htmlFor="ebitda" className="block text-sm font-medium text-gray-700">
                        Earnings (EBITDA) ($)
                      </label>
                      <input
                        type="number"
                        id="ebitda"
                        value={formData.ebitda}
                        onChange={(e) => handleInputChange('ebitda', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="2000000"
                      />
                    </div>

                  </div>
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

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading assessment form...</p>
      </div>
    </div>}>
      <NewAssessmentPageContent />
    </Suspense>
  );
}