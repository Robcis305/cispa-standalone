'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    loadSharedReport();
  }, [token]);

  const loadSharedReport = async () => {
    try {
      setLoading(true);
      console.log('Loading shared report for token:', token);
      
      // Decode the token (handle URL encoding issues)
      console.log('Raw token:', token);
      console.log('Token length:', token.length);
      
      // First decode any URL encoding
      let cleanToken = decodeURIComponent(token);
      console.log('URL decoded token:', cleanToken);
      
      // Add padding if needed for base64
      while (cleanToken.length % 4) {
        cleanToken += '=';
      }
      console.log('Padded token:', cleanToken);
      
      const decodedString = atob(cleanToken);
      console.log('Base64 decoded string:', decodedString);
      
      const decodedData = JSON.parse(decodedString);
      
      console.log('Decoded data:', decodedData);
      
      // Check if expired
      if (decodedData.expirationHours) {
        const expirationTime = decodedData.createdAt + (decodedData.expirationHours * 60 * 60 * 1000);
        if (Date.now() > expirationTime) {
          setError('Share link has expired');
          return;
        }
      }
      
      // Set the data
      setShareData(decodedData);
      console.log('Share data set successfully');
      
    } catch (err) {
      console.error('Error loading shared report:', err);
      setError('Invalid or corrupted share link');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!shareData) return;
    
    try {
      setIsGeneratingPDF(true);
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      let yPosition = margin;
      
      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        
        // Check if we need a new page
        if (yPosition + (lines.length * fontSize * 0.4) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.4 + 5;
      };
      
      // Header
      addText('CIS Partners - Transaction Readiness Assessment', 18, true);
      addText(`${shareData.title || 'Assessment'} • ${shareData.companyName || 'Company'}`, 14);
      yPosition += 10;
      
      // Overall Score
      addText('Transaction Readiness Score', 16, true);
      addText(`Overall Score: ${shareData.overallScore || 0}/100`, 14, true);
      
      const scoreDescription = 
        (shareData.overallScore || 0) >= 80 ? 'Excellent readiness for transaction. Company is well-positioned for a successful process.' :
        (shareData.overallScore || 0) >= 65 ? 'Good readiness with some areas for improvement. Address key issues to optimize value.' :
        (shareData.overallScore || 0) >= 40 ? 'Moderate readiness. Significant preparation needed before starting transaction process.' :
        'Low readiness. Substantial work required before considering any transaction.';
      
      addText(scoreDescription, 11);
      yPosition += 10;
      
      // Dimension Breakdown
      addText('Dimension Breakdown', 16, true);
      (shareData.dimensionScores || []).forEach((dim: any) => {
        addText(`${dim.dimension}: ${dim.score}/100`, 12, true);
      });
      yPosition += 10;
      
      // Recommendations
      if (shareData.recommendations && shareData.recommendations.length > 0) {
        addText('Priority Recommendations', 16, true);
        shareData.recommendations.forEach((rec: any, index: number) => {
          addText(`${index + 1}. ${rec.title} (${rec.priority === 'high' ? 'High Priority' : 'Medium Priority'})`, 12, true);
          addText(rec.description, 11);
          addText('Recommended Actions:', 11, true);
          rec.actions.forEach((action: string) => {
            addText(`• ${action}`, 10);
          });
          yPosition += 5;
        });
      }
      
      // Footer
      yPosition = pageHeight - 30;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${new Date().toLocaleDateString()} | CIS Partners`, margin, yPosition);
      pdf.text(`Shared Report - ${shareData.permissions?.view ? 'View' : ''}${shareData.permissions?.view && shareData.permissions?.download ? ' & ' : ''}${shareData.permissions?.download ? 'Download' : ''} Access`, margin, yPosition + 10);
      
      // Save the PDF
      const filename = `${shareData.companyName || 'Company'}_${shareData.title || 'Assessment'}_Report.pdf`;
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shared report...</p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Success view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/login" className="flex items-center">
                <img 
                  src="/cis-partners-logo.png" 
                  alt="CIS Partners" 
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-xl font-bold text-gray-900">- Shared Report</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Readiness Assessment</h1>
              <p className="text-gray-600 mt-1">{shareData?.title} • {shareData?.companyName}</p>
            </div>
            {shareData?.permissions?.download && (
              <button 
                onClick={downloadPDF}
                disabled={isGeneratingPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Download PDF'
                )}
              </button>
            )}
          </div>

          {/* Share Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Shared Report Access</p>
                <p className="text-sm text-blue-700 mt-1">
                  Permissions: {shareData?.permissions?.view ? 'View' : ''} 
                  {shareData?.permissions?.view && shareData?.permissions?.download ? ' & ' : ''}
                  {shareData?.permissions?.download ? 'Download' : ''}
                  {shareData?.expirationHours && (
                    ` • Expires: ${new Date(shareData.createdAt + (shareData.expirationHours * 60 * 60 * 1000)).toLocaleDateString()}`
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
                <span className="text-3xl font-bold text-blue-600">{shareData?.overallScore || 0}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Readiness Score</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {(shareData?.overallScore || 0) >= 80 ? 'Excellent readiness for transaction. Company is well-positioned for a successful process.' :
                 (shareData?.overallScore || 0) >= 65 ? 'Good readiness with some areas for improvement. Address key issues to optimize value.' :
                 (shareData?.overallScore || 0) >= 40 ? 'Moderate readiness. Significant preparation needed before starting transaction process.' :
                 'Low readiness. Substantial work required before considering any transaction.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dimension Scores */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Dimension Breakdown</h3>
              <div className="space-y-6">
                {(shareData?.dimensionScores || []).map((dim: any) => {
                  const getColor = (score: number) => {
                    if (score >= 80) return 'green';
                    if (score >= 65) return 'yellow';
                    if (score >= 40) return 'orange';
                    return 'red';
                  };
                  const color = getColor(dim.score);
                  
                  return (
                    <div key={dim.dimension} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 capitalize">{dim.dimension}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          color === 'green' ? 'text-green-600 bg-green-100' :
                          color === 'yellow' ? 'text-yellow-600 bg-yellow-100' :
                          color === 'orange' ? 'text-orange-600 bg-orange-100' :
                          'text-red-600 bg-red-100'
                        }`}>
                          {dim.score}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            color === 'green' ? 'bg-green-500' :
                            color === 'yellow' ? 'bg-yellow-500' : 
                            color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Priority Recommendations</h3>
              <div className="space-y-6">
                {(shareData?.recommendations || []).map((rec: any, index: number) => (
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
                        {rec.actions.map((action: any, actionIndex: number) => (
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
                  <span className="font-medium">Core Assessment</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Share Created</span>
                  <span className="font-medium">
                    {new Date(shareData?.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">About CIS Partners</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p>• Comprehensive transaction readiness assessments</p>
                <p>• AI-powered recommendations and insights</p>
                <p>• Secure sharing and collaboration tools</p>
                <p>• Professional-grade reporting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}