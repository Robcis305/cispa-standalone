import { jsPDF } from 'jspdf';

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

interface ReportData {
  assessment: {
    title: string;
    company: string;
    completedAt: string;
    overallScore: number;
  };
  dimensionScores: DimensionScore[];
  recommendations: Recommendation[];
  timestamp: string;
}

export const generatePDFReport = async (data: ReportData): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize: number) => {
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(text, maxWidth);
  };

  // Header
  pdf.setFillColor(37, 99, 235); // Blue background
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CISPA TRANSACTION READINESS', margin, 25);
  pdf.text('ASSESSMENT REPORT', margin, 35);
  
  currentY = 60;

  // Company Information
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Assessment Overview', margin, currentY);
  currentY += 15;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Company: ${data.assessment.company}`, margin, currentY);
  currentY += 7;
  pdf.text(`Assessment: ${data.assessment.title}`, margin, currentY);
  currentY += 7;
  pdf.text(`Completed: ${new Date(data.assessment.completedAt).toLocaleDateString()}`, margin, currentY);
  currentY += 7;
  pdf.text(`Generated: ${new Date(data.timestamp).toLocaleDateString()}`, margin, currentY);
  currentY += 20;

  // Overall Score Section
  checkPageBreak(60);
  
  // Score circle background
  pdf.setFillColor(239, 246, 255); // Light blue background
  pdf.circle(pageWidth / 2, currentY + 25, 25, 'F');
  
  // Score circle border
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(2);
  pdf.circle(pageWidth / 2, currentY + 25, 25, 'S');
  
  // Score text
  pdf.setTextColor(37, 99, 235);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  const scoreText = data.assessment.overallScore.toString();
  const scoreWidth = pdf.getTextWidth(scoreText);
  pdf.text(scoreText, (pageWidth - scoreWidth) / 2, currentY + 30);
  
  // "Overall Score" label
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const labelText = 'Overall Readiness Score';
  const labelWidth = pdf.getTextWidth(labelText);
  pdf.text(labelText, (pageWidth - labelWidth) / 2, currentY + 60);
  
  currentY += 80;

  // Score interpretation
  checkPageBreak(20);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const interpretation = data.assessment.overallScore >= 80 ? 
    'EXCELLENT: Your company demonstrates strong transaction readiness across all dimensions.' :
    data.assessment.overallScore >= 65 ?
    'GOOD: Your company shows solid preparation with some areas for improvement.' :
    data.assessment.overallScore >= 40 ?
    'MODERATE: Significant preparation needed before initiating transaction processes.' :
    'LOW: Substantial work required across multiple dimensions before considering transactions.';
  
  const wrappedInterpretation = wrapText(interpretation, contentWidth, 12);
  wrappedInterpretation.forEach((line: string) => {
    pdf.text(line, margin, currentY);
    currentY += 6;
  });
  currentY += 20;

  // Dimension Scores Section
  checkPageBreak(30);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Dimension Breakdown', margin, currentY);
  currentY += 15;

  data.dimensionScores.forEach((dim) => {
    checkPageBreak(25);
    
    // Dimension name
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dim.dimension.charAt(0).toUpperCase() + dim.dimension.slice(1), margin, currentY);
    
    // Score
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${dim.score}/100`, pageWidth - margin - 30, currentY);
    currentY += 5;
    
    // Progress bar background
    pdf.setFillColor(229, 231, 235); // Gray background
    pdf.rect(margin, currentY, contentWidth, 6, 'F');
    
    // Progress bar fill
    const fillWidth = (contentWidth * dim.score) / 100;
    const color = dim.score >= 80 ? [34, 197, 94] : // Green
                  dim.score >= 65 ? [234, 179, 8] : // Yellow
                  dim.score >= 40 ? [249, 115, 22] : // Orange
                  [239, 68, 68]; // Red
    
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(margin, currentY, fillWidth, 6, 'F');
    
    currentY += 15;
  });

  currentY += 10;

  // Recommendations Section
  if (data.recommendations.length > 0) {
    checkPageBreak(30);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Priority Recommendations', margin, currentY);
    currentY += 15;

    data.recommendations.forEach((rec, index) => {
      checkPageBreak(40);
      
      // Priority badge
      const priorityColor = rec.priority === 'high' ? [239, 68, 68] : [234, 179, 8];
      pdf.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
      pdf.rect(margin, currentY - 5, 50, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(rec.priority.toUpperCase() + ' PRIORITY', margin + 2, currentY);
      
      // Recommendation title
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${rec.title}`, margin + 55, currentY);
      currentY += 10;
      
      // Description
      pdf.setFont('helvetica', 'normal');
      const wrappedDescription = wrapText(rec.description, contentWidth, 10);
      wrappedDescription.forEach((line: string) => {
        pdf.text(line, margin, currentY);
        currentY += 5;
      });
      currentY += 3;
      
      // Actions
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recommended Actions:', margin, currentY);
      currentY += 7;
      
      pdf.setFont('helvetica', 'normal');
      rec.actions.forEach((action) => {
        checkPageBreak(8);
        pdf.text('•', margin + 5, currentY);
        const wrappedAction = wrapText(action, contentWidth - 15, 10);
        wrappedAction.forEach((line: string, lineIndex: number) => {
          pdf.text(line, margin + 10, currentY + (lineIndex * 5));
        });
        currentY += wrappedAction.length * 5 + 2;
      });
      
      currentY += 10;
    });
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated by CISPA Platform • Page ${i} of ${totalPages}`, margin, pageHeight - 10);
    pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 30, pageHeight - 10);
  }

  // Save the PDF
  const fileName = `${data.assessment.company.replace(/[^a-zA-Z0-9]/g, '-')}-assessment-report-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};