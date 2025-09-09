import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = id;

    // Fetch the assessment data
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single();

    if (error) {
      console.error('Error fetching assessment:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessment' },
        { status: 500 }
      );
    }

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      assessment,
      success: true
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}