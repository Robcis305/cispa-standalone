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
  PencilIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { Assessment } from '@/types/database.types';
import { generatePDFReport } from '@/lib/pdfReportGenerator';
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
  score: number;
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

      // Calculate dimension breakdown - show all 6 dimensions
      const dimensions = ['financial', 'operational', 'market', 'technology', 'legal', 'strategic'];
      
      const breakdown: DimensionScore[] = dimensions.map(dim => {
        const dimQuestions = questionsData.filter(q => q.dimension === dim);
        const dimAnswers = answersData.filter(a => 
          dimQuestions.some(q => q.question_id === a.question_id)
        );
        
        const totalScore = dimAnswers.reduce((sum, answer) => sum + (answer.score_impact || 0), 0);
        const maxPossibleScore = dimQuestions.length * 6; // Each question max score is 6
        
        return {
          dimension: dim,
          score: totalScore || 0, // Raw score (not percentage)
          questions: dimQuestions.length,
          maxScore: maxPossibleScore || 0
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
          overallScore: actualScore
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


  // Map database dimensions to your preferred display names
  const dimensionDisplayNames: Record<string, string> = {
    'financial': 'Financial Integrity',
    'operational': 'Team Capability', 
    'market': 'Market Positioning',
    'technology': 'Presentation Quality',
    'legal': 'Capital Clarity',
    'strategic': 'Strategic Narrative'
  };

  const getDimensionDescription = (dimension: string, score: number) => {
    const descriptions = {
      'financial': score >= 70 ? 'Clean financials with strong reporting systems.' : 
                   score >= 40 ? 'Solid foundation, but reporting needs improvement.' : 
                   'Financial systems and integrity need immediate attention.',
      'operational': score >= 70 ? 'Strong leadership team with proven track record.' : 
                     score >= 40 ? 'Good team foundation, some key roles need strengthening.' : 
                     'Team capabilities require significant development.',
      'market': score >= 70 ? 'Strong market position with clear differentiation.' : 
                score >= 40 ? 'Good positioning, but competitive advantage could be clearer.' : 
                'Market positioning needs significant improvement.',
      'technology': score >= 70 ? 'Professional materials that effectively communicate value.' : 
                    score >= 40 ? 'Good materials, but could be more compelling.' : 
                    'Presentation materials need significant improvement.',
      'legal': score >= 70 ? 'Clear capital structure and efficient use of funds.' : 
               score >= 40 ? 'Generally clear structure, some optimization needed.' : 
               'Capital structure and clarity need immediate attention.',
      'strategic': score >= 70 ? 'Compelling story with clear value proposition.' : 
                   score >= 40 ? 'Good story foundation, but needs refinement.' : 
                   'Strategic narrative requires significant development.'
    };
    return descriptions[dimension as keyof typeof descriptions] || '';
  };

  const generateRecommendations = (dimensionScores: DimensionScore[]) => {
    const recommendations: Recommendation[] = [];
    
    // Create recommendations for all dimensions that need improvement (score < 70)
    dimensionScores.forEach(dim => {
      const displayName = dimensionDisplayNames[dim.dimension] || dim.dimension;
      
      if (dim.score < 40) {
        recommendations.push({
          priority: 'high',
          dimension: dim.dimension,
          score: dim.score, // Add score for sorting
          title: `Critical ${displayName} Issues`,
          description: `Your ${displayName.toLowerCase()} readiness is critically low. This requires immediate attention before proceeding with any transaction.`,
          actions: getRecommendationActions(dim.dimension, 'critical')
        });
      } else if (dim.score < 70) {
        recommendations.push({
          priority: 'medium',
          dimension: dim.dimension,
          score: dim.score, // Add score for sorting
          title: `${displayName} Improvements Needed`,
          description: `There are opportunities to strengthen your ${displayName.toLowerCase()} position to increase transaction attractiveness.`,
          actions: getRecommendationActions(dim.dimension, 'moderate')
        });
      }
    });

    // Sort recommendations by priority (high first) then by score (lowest first)
    return recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.score - b.score; // Lowest score first within same priority
    });
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

  // Calculate overall score using 150-point system (25 points per dimension)
  const calculateOverallScore = (dimensionBreakdown: DimensionScore[]) => {
    const totalRawScore = dimensionBreakdown.reduce((sum, dim) => sum + dim.score, 0);
    const maxPossibleTotal = 150; // 6 dimensions × 25 points each
    return Math.min(totalRawScore, maxPossibleTotal);
  };

  const getTransactionReadinessLevel = (actualScore: number) => {
    const percentage = (actualScore / 150) * 100;
    if (actualScore >= 90) return { 
      level: 'ready', 
      color: '#27AE60', 
      label: 'Certified & Ready to Go',
      status: 'Ready',
      description: 'CIS Transaction Ready'
    };
    if (actualScore >= 75) return { 
      level: 'near-ready', 
      color: '#F2C94C', 
      label: 'Near Ready – Fixable Gaps',
      status: 'Near Ready',
      description: 'Minor improvements needed'
    };
    return { 
      level: 'not-ready', 
      color: '#EB5757', 
      label: 'Not Ready – Prep Required',
      status: 'Not Ready',
      description: 'Significant preparation required'
    };
  };

  const getCISTransactionReadyCriteria = (actualScore: number, dimensionBreakdown: DimensionScore[]) => {
    const criteria = {
      comprehensiveScore: actualScore >= 90,
      averageScore: dimensionBreakdown.length > 0 ? (actualScore / dimensionBreakdown.length) >= 4.0 : false,
      noRedStatuses: dimensionBreakdown.every(dim => (dim.score / dim.maxScore) >= 0.4), // No dimension below 40%
      allRequiredOutputs: true // Assuming completed if viewing results
    };
    
    const isTransactionReady = Object.values(criteria).every(Boolean);
    
    return { ...criteria, isTransactionReady };
  };

  const getStatusMessage = (actualScore: number) => {
    if (actualScore >= 90) {
      return {
        icon: '✅',
        title: 'You are CIS Transaction Ready.',
        message: 'All criteria met — you are certified and ready to proceed with confidence to maximize value.'
      };
    } else if (actualScore >= 75) {
      return {
        icon: '⚠️',
        title: 'Near ready with fixable gaps.',
        message: 'You are close to transaction ready status. Address the highlighted gaps to achieve full certification.'
      };
    } else {
      return {
        icon: '❌',
        title: 'Not ready — preparation required.',
        message: 'Significant work needed before transaction readiness. Focus on foundational improvements first.'
      };
    }
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
  const actualScore = calculateOverallScore(dimensionBreakdown);
  const readinessPercentage = Math.round((actualScore / 150) * 100);
  const readinessLevel = getTransactionReadinessLevel(actualScore);
  const cisCriteria = getCISTransactionReadyCriteria(actualScore, dimensionBreakdown);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="mb-8">
          {/* New Scorecard Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{assessment.company_name}</h1>
              <p className="text-gray-600 mb-2">{assessment.title}</p>
              <p className="text-sm text-gray-500 mb-8">
                Completed: {assessment.completed_at ? new Date(assessment.completed_at).toLocaleDateString() : 'N/A'}
              </p>
              
              {/* Comprehensive Readiness Index */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Comprehensive Readiness Index</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Interpretation Scale */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700 text-sm">Interpretation (Actual Score)</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>≥ 90 &nbsp;&nbsp;&nbsp; Certified & Ready to Go</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span>75-89 &nbsp; Near Ready – Fixable Gaps</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>&lt; 75 &nbsp;&nbsp;&nbsp;&nbsp; Not Ready – Prep Required</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Scores */}
                  <div className="space-y-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Max Possible Score</div>
                      <div className="text-2xl font-bold text-gray-900">150</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Actual Score</div>
                      <div className="text-2xl font-bold text-gray-900">{actualScore}</div>
                    </div>
                  </div>
                  
                  {/* Readiness Percentage */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-2">Readiness Index (%)</div>
                    <div 
                      className="text-4xl font-bold text-white px-6 py-4 rounded"
                      style={{ backgroundColor: readinessLevel.color }}
                    >
                      {readinessPercentage}%
                    </div>
                  </div>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Transaction Readiness Assessment</h2>
            </div>
          </div>
          
          {/* Status & Call to Action Section */}
          <div 
            className="rounded-lg shadow-sm p-6 mb-8 border-l-4" 
            style={{ 
              backgroundColor: `${readinessLevel.color}20`,
              borderLeftColor: readinessLevel.color
            }}
          >
            <div className="flex items-start space-x-4">
              <div className="text-3xl">{getStatusMessage(actualScore).icon}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span 
                    className="px-3 py-1 rounded text-white font-bold"
                    style={{ backgroundColor: readinessLevel.color }}
                  >
                    {readinessLevel.status}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">
                    {getStatusMessage(actualScore).title}
                  </h3>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed mb-4">
                  {getStatusMessage(actualScore).message}
                </p>
                
                {/* CIS Transaction Ready Criteria */}
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">CIS Transaction Ready Criteria</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className={cisCriteria.comprehensiveScore ? 'text-green-600' : 'text-red-600'}>
                        {cisCriteria.comprehensiveScore ? '✓' : '✗'}
                      </span>
                      <span>Comprehensive Readiness Score ≥ 90</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={cisCriteria.averageScore ? 'text-green-600' : 'text-red-600'}>
                        {cisCriteria.averageScore ? '✓' : '✗'}
                      </span>
                      <span>Average score ≥ 4.0 across all dimensions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={cisCriteria.noRedStatuses ? 'text-green-600' : 'text-red-600'}>
                        {cisCriteria.noRedStatuses ? '✓' : '✗'}
                      </span>
                      <span>No 'Red' statuses in any dimension</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={cisCriteria.allRequiredOutputs ? 'text-green-600' : 'text-red-600'}>
                        {cisCriteria.allRequiredOutputs ? '✓' : '✗'}
                      </span>
                      <span>All required outputs completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Detailed Assessment Report</h3>
              <p className="text-gray-600 mt-1">Complete analysis and recommendations</p>
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#B10300' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8B0000'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B10300'}
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                {generatingReport ? 'Generating PDF...' : 'Generate PDF Report 📄'}
              </button>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dimension Scores */}
          <div className="lg:col-span-2">
            {/* Dimension Breakdown - New Design */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Dimension Breakdown
              </h3>
              <div className="space-y-6">
                {dimensionBreakdown.map((dim) => {
                  const readinessLevel = getTransactionReadinessLevel(dim.score);
                  return (
                    <div key={dim.dimension} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-gray-900 text-lg">
                            {dimensionDisplayNames[dim.dimension] || dim.dimension}
                          </span>
                        </div>
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: readinessLevel.color }}
                        >
                          {dim.score}
                        </span>
                      </div>
                      
                      {/* Horizontal progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                        <div 
                          className="h-4 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${dim.score}%`,
                            backgroundColor: readinessLevel.color
                          }}
                        />
                      </div>
                      
                      {/* One-liner description */}
                      <p className="text-gray-600 text-sm italic">
                        {getDimensionDescription(dim.dimension, dim.score)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Readiness Overview Treemap */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Readiness Overview</h3>
              <div className="grid grid-cols-3 grid-rows-2 gap-2 h-64">
                {dimensionBreakdown.map((dim) => {
                  const dimPercentage = dim.maxScore > 0 ? Math.round((dim.score / dim.maxScore) * 100) : 0;
                  const dimReadinessLevel = getTransactionReadinessLevel(dimPercentage * 1.5);
                  const displayName = dimensionDisplayNames[dim.dimension] || dim.dimension;
                  
                  return (
                    <div 
                      key={dim.dimension}
                      className="rounded p-3 flex flex-col justify-center items-center text-center text-white font-semibold transition-all duration-300 hover:opacity-90"
                      style={{ 
                        backgroundColor: dimReadinessLevel.color,
                        opacity: 0.9
                      }}
                    >
                      <div className="text-sm font-medium">{displayName}</div>
                      <div className="text-xs mt-1">{dimPercentage}%</div>
                      <div className="text-xs opacity-80">{dim.score}/{dim.maxScore}</div>
                    </div>
                  );
                })}
              </div>
              
              {/* Status and Criteria */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span 
                        className="px-2 py-1 rounded text-white text-sm font-bold"
                        style={{ backgroundColor: readinessLevel.color }}
                      >
                        {readinessLevel.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-3">
                      To be deemed "CIS Transaction Ready," a company must:
                    </div>
                    
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Achieve a Comprehensive Readiness Score ≥ 90</li>
                      <li>Have an average score ≥ 4.0 across all six dimensions</li>
                      <li>No 'Red' statuses in any dimension</li>
                      <li>All required outputs completed (deck, model, capital plan, etc.)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Plan Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Action Plan</h3>
              <div className="space-y-4">
                {actualScore >= 90 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Ready to Proceed</h4>
                    <ul className="text-green-700 space-y-2">
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Begin investor outreach; CIS can connect you to buyers/capital
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Prepare transaction materials and data room
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Engage transaction advisors and legal counsel
                      </li>
                    </ul>
                  </div>
                ) : actualScore >= 75 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">90-Day Improvement Plan</h4>
                    <ul className="text-yellow-700 space-y-2">
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Focus on operational controls in next 90 days; then re-assess
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Address highest-priority dimension gaps identified above
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Work with CIS advisors to accelerate improvements
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Foundation Building Required</h4>
                    <ul className="text-red-700 space-y-2">
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Prioritize financial reporting upgrades and governance
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        CIS provides a Transaction Ready Playbook to accelerate this
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Schedule follow-up assessment in 6 months
                      </li>
                    </ul>
                  </div>
                )}
                
                {/* Detailed recommendations if there are any issues */}
                {recommendations.length > 0 && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Priority Focus Areas</h4>
                    <div className="space-y-4">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="bg-gray-50 rounded-md p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium text-gray-900">{rec.title}</h5>
                              <span className="text-sm text-gray-500">(Score: {rec.score})</span>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {rec.priority === 'high' ? 'Critical' : 'Moderate'} Priority
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                          
                          {/* Show top 2 action items for each recommendation */}
                          {rec.actions.length > 0 && (
                            <div className="bg-white rounded p-3">
                              <p className="text-xs font-medium text-gray-700 mb-2">Key Actions:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {rec.actions.slice(0, 2).map((action, actionIndex) => (
                                  <li key={actionIndex} className="flex items-start">
                                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
            <div className="border rounded-lg p-6" style={{ backgroundColor: '#19191920', borderColor: '#191919' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#191919' }}>Next Steps</h3>
              <div className="space-y-3 text-sm" style={{ color: '#191919' }}>
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