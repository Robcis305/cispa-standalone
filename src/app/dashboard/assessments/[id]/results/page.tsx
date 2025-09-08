'use client';
import { useState, useEffect, useCallback } from 'react';

// Disable static generation for this page since it uses Supabase
export const dynamic = 'force-dynamic';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  ShareIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { Assessment } from '@/types/database.types';
import { generatePDFReport } from '@/lib/pdfReportGenerator';
import { SharingService } from '@/lib/sharingService';
import ShareModal from '@/components/ShareModal';

interface DimensionScore {
  dimension: string;
  score: number;
  questions: number;
  maxScore: number;
}

interface Recommendation {
  priority: 'high' | 'medium';
  dimension: string;
  title: string;
  description: string;
  actions: string[];
}

export default function AssessmentResultsPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [dimensionBreakdown, setDimensionBreakdown] = useState<DimensionScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [sharingResults, setSharingResults] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const loadResults = useCallback(async () => {
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

      // Load questions and answers for detailed breakdown
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('module', 'core')
        .eq('is_active', true);

      if (questionsError) throw questionsError;

      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (answersError) throw answersError;

      // Calculate dimension breakdown
      const dimensions = ['financial', 'operational', 'market', 'technology', 'legal', 'strategic'];
      const breakdown: DimensionScore[] = dimensions.map(dim => {
        const dimQuestions = questionsData.filter(q => q.dimension === dim);
        const dimAnswers = answersData.filter(a => 
          dimQuestions.some(q => q.question_id === a.question_id)
        );
        
        const totalScore = dimAnswers.reduce((sum, answer) => sum + (answer.score_impact || 0), 0);
        const maxPossibleScore = dimQuestions.length * 6;
        
        return {
          dimension: dim,
          score: Math.round((totalScore / maxPossibleScore) * 100),
          questions: dimQuestions.length,
          maxScore: 100
        };
      });

      setDimensionBreakdown(breakdown);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  const generateReport = async () => {
    if (!assessment) return;
    
    setGeneratingReport(true);
    try {
      // Create a comprehensive report object
      const reportData = {
        assessment: {
          title: assessment.title,
          company: assessment.company_name,
          completedAt: assessment.completed_at || new Date().toISOString(),
          overallScore: assessment.overall_readiness_score || 0
        },
        dimensionScores: dimensionBreakdown,
        recommendations: generateRecommendations(dimensionBreakdown),
        timestamp: new Date().toISOString()
      };

      // Generate PDF report
      await generatePDFReport(reportData);
      
    } catch (error) {
      console.error('Error generating report:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      alert(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const shareResults = async () => {
    if (!assessment) return;
    setShowShareModal(true);
  };

  const createShareLink = async (options: {
    permissions: { view: boolean; download: boolean };
    expiration_hours?: number;
    email_restrictions?: string[];
  }) => {
    if (!assessment) return;

    setSharingResults(true);
    try {
      // Include actual assessment data in the share token
      const shareData = {
        assessmentId,
        companyName: assessment.company_name,
        title: assessment.title,
        overallScore: assessment.overall_readiness_score || 0,
        dimensionScores: dimensionBreakdown,
        recommendations: generateRecommendations(dimensionBreakdown),
        permissions: options.permissions,
        expirationHours: options.expiration_hours,
        emailRestrictions: options.email_restrictions,
        createdAt: Date.now(),
      };
      
      // Create a simple encoded token (in production, this would be encrypted)
      const token = btoa(JSON.stringify(shareData));
      
      // Generate shareable URL
      const shareUrl = `${window.location.origin}/shared/${token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      const expirationText = options.expiration_hours 
        ? new Date(Date.now() + options.expiration_hours * 60 * 60 * 1000).toLocaleString()
        : 'Never';
      
      alert(`Share link created and copied to clipboard!\n\nLink expires: ${expirationText}\nPermissions: ${options.permissions.view ? 'View' : ''} ${options.permissions.download ? 'Download' : ''}\n\nNote: This is a demo implementation. In production, shares would be stored securely in the database.`);
      
      setShowShareModal(false);
    } catch (error) {
      console.error('Error creating share link:', error);
      alert(`Error creating share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSharingResults(false);
    }
  };


  const generateRecommendations = (dimensionScores: DimensionScore[]) => {
    const recommendations: Recommendation[] = [];
    
    dimensionScores.forEach(dim => {
      if (dim.score < 40) {
        recommendations.push({
          priority: 'high',
          dimension: dim.dimension,
          title: `Critical ${dim.dimension.charAt(0).toUpperCase() + dim.dimension.slice(1)} Issues`,
          description: `Your ${dim.dimension} readiness is below acceptable levels. This requires immediate attention before proceeding with any transaction.`,
          actions: getRecommendationActions(dim.dimension, 'critical')
        });
      } else if (dim.score < 65) {
        recommendations.push({
          priority: 'medium',
          dimension: dim.dimension,
          title: `${dim.dimension.charAt(0).toUpperCase() + dim.dimension.slice(1)} Improvements Needed`,
          description: `There are opportunities to strengthen your ${dim.dimension} position to increase transaction attractiveness.`,
          actions: getRecommendationActions(dim.dimension, 'moderate')
        });
      }
    });

    return recommendations;
  };

  const getRecommendationActions = (dimension: string, severity: 'critical' | 'moderate') => {
    const actions: Record<string, Record<string, string[]>> = {
      financial: {
        critical: [
          'Engage a CFO or financial consultant immediately',
          'Obtain audited financial statements for past 2 years',
          'Implement robust financial controls and reporting',
          'Address any cash flow or runway concerns'
        ],
        moderate: [
          'Review and optimize gross margins',
          'Improve financial reporting and KPI tracking',
          'Consider management reporting enhancements',
          'Evaluate working capital optimization opportunities'
        ]
      },
      operational: {
        critical: [
          'Document all critical business processes',
          'Implement succession planning for key roles',
          'Reduce customer concentration risks',
          'Establish formal operational procedures'
        ],
        moderate: [
          'Enhance operational efficiency metrics',
          'Improve management information systems',
          'Strengthen supplier relationships and contracts',
          'Invest in operational excellence initiatives'
        ]
      },
      market: {
        critical: [
          'Conduct comprehensive market analysis',
          'Develop clear competitive differentiation strategy',
          'Address customer satisfaction issues immediately',
          'Stabilize and document revenue model'
        ],
        moderate: [
          'Strengthen market positioning',
          'Enhance customer retention programs',
          'Develop recurring revenue opportunities',
          'Improve Net Promoter Score'
        ]
      },
      technology: {
        critical: [
          'Audit and upgrade core technology infrastructure',
          'Implement comprehensive cybersecurity measures',
          'Protect intellectual property through proper legal channels',
          'Document all technology assets and dependencies'
        ],
        moderate: [
          'Enhance system scalability and performance',
          'Increase automation of key processes',
          'Strengthen data backup and recovery procedures',
          'Consider cloud migration opportunities'
        ]
      },
      legal: {
        critical: [
          'Resolve all pending legal issues immediately',
          'Complete corporate structure cleanup',
          'Ensure all employees have proper IP assignments',
          'Achieve full regulatory compliance'
        ],
        moderate: [
          'Review and strengthen customer/supplier contracts',
          'Update employment agreements',
          'Enhance compliance monitoring procedures',
          'Consider legal entity optimization'
        ]
      },
      strategic: {
        critical: [
          'Develop clear 3-5 year strategic vision',
          'Strengthen management team capabilities',
          'Establish comprehensive KPI framework',
          'Address scalability limitations immediately'
        ],
        moderate: [
          'Enhance strategic planning processes',
          'Improve management team depth',
          'Develop better performance measurement',
          'Increase strategic value for potential acquirers'
        ]
      }
    };

    return actions[dimension]?.[severity] || [];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 65) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 65) return <CheckCircleIcon className="h-5 w-5" />;
    return <ExclamationTriangleIcon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Results Not Available</h3>
          <p className="text-gray-600 mb-6">{error || 'Unable to load assessment results.'}</p>
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

  const recommendations = generateRecommendations(dimensionBreakdown);
  const overallScore = assessment.overall_readiness_score || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboard/assessments/${assessmentId}`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Assessment
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                CISPA Platform
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
              <p className="text-gray-600 mt-1">{assessment.title} • {assessment.company_name}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/assessments/${assessmentId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Assessment
              </Link>
              <Link
                href={`/dashboard/assessments/${assessmentId}/investors`}
                className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Find Investors
              </Link>
              <button
                onClick={shareResults}
                disabled={sharingResults}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                {sharingResults ? 'Sharing...' : 'Share Results'}
              </button>
              <button
                onClick={generateReport}
                disabled={generatingReport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                {generatingReport ? 'Generating PDF...' : 'Generate PDF Report 📄'}
              </button>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
                <span className="text-3xl font-bold text-blue-600">{overallScore}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Readiness Score</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {overallScore >= 80 ? 'Excellent readiness for transaction. You are well-positioned for a successful process.' :
                 overallScore >= 65 ? 'Good readiness with some areas for improvement. Address key issues to optimize value.' :
                 overallScore >= 40 ? 'Moderate readiness. Significant preparation needed before starting transaction process.' :
                 'Low readiness. Substantial work required before considering any transaction.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dimension Scores */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Dimension Breakdown
              </h3>
              <div className="space-y-6">
                {dimensionBreakdown.map((dim) => (
                  <div key={dim.dimension} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getScoreIcon(dim.score)}
                        <span className="font-medium text-gray-900 capitalize">
                          {dim.dimension}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(dim.score)}`}>
                        {dim.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          dim.score >= 80 ? 'bg-green-500' :
                          dim.score >= 65 ? 'bg-yellow-500' :
                          dim.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Priority Recommendations</h3>
                <div className="space-y-6">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {rec.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{rec.description}</p>
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-sm font-medium text-gray-900 mb-2">Recommended Actions:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rec.actions.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-start">
                              <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions Answered</span>
                  <span className="font-medium">30/30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Time</span>
                  <span className="font-medium">
                    {assessment.time_to_completion ? 
                      Math.round(parseFloat(assessment.time_to_completion.split(':')[1])) + ' minutes' : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Template Used</span>
                  <span className="font-medium capitalize">{assessment.template_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">
                    {assessment.completed_at ? new Date(assessment.completed_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Next Steps</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p>• Explore personalized investor matches based on your scores</p>
                <p>• Download your comprehensive assessment report</p>
                <p>• Share results with your team and advisors</p>
                <p>• Begin working on priority recommendations</p>
                <p>• Schedule follow-up assessment in 3-6 months</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCreateShare={createShareLink}
        isLoading={sharingResults}
      />
    </div>
  );
}