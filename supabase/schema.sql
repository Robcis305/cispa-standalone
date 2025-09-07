-- CISPA Platform Database Schema
-- Based on sprint planning document data architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'advisor' CHECK (role IN ('advisor', 'founder', 'admin')),
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table - Stores the assessment question library
CREATE TABLE public.questions (
  question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'number', 'file_upload', 'multiple_choice', 'scale', 'boolean')),
  dimension TEXT NOT NULL CHECK (dimension IN ('financial', 'operational', 'market', 'technology', 'legal', 'strategic')),
  module TEXT NOT NULL DEFAULT 'core' CHECK (module IN ('core', 'marketing', 'technology', 'human_capital', 'investor')),
  order_index INTEGER NOT NULL DEFAULT 0,
  branching_conditions JSONB DEFAULT '{}',
  weight DECIMAL(3,2) DEFAULT 1.00,
  scoring_impact DECIMAL(3,2) DEFAULT 1.00,
  options JSONB DEFAULT '[]', -- For multiple choice questions
  validation_rules JSONB DEFAULT '{}',
  help_text TEXT,
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table - Master record for each assessment instance
CREATE TABLE public.assessments (
  assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT NOT NULL,
  advisor_id UUID REFERENCES public.users(id) NOT NULL,
  founder_id UUID REFERENCES public.users(id),
  template_type TEXT NOT NULL DEFAULT 'transaction_readiness',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  timeline TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_to_completion INTERVAL,
  current_question_id UUID REFERENCES public.questions(question_id),
  overall_readiness_score DECIMAL(5,2),
  dimension_scores JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table - Captures all user responses tied to specific assessments
CREATE TABLE public.answers (
  answer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES public.assessments(assessment_id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(question_id) NOT NULL,
  answer_value TEXT NOT NULL,
  answer_metadata JSONB DEFAULT '{}', -- file paths, additional context
  score_impact DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_by UUID REFERENCES public.users(id),
  
  UNIQUE(assessment_id, question_id) -- One answer per question per assessment
);

-- Reports table - Generated assessment reports
CREATE TABLE public.reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES public.assessments(assessment_id) ON DELETE CASCADE NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'comprehensive' CHECK (report_type IN ('comprehensive', 'summary', 'executive')),
  title TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  file_format TEXT DEFAULT 'pdf',
  generation_status TEXT NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  generation_started_at TIMESTAMP WITH TIME ZONE,
  generation_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shares table - Manages secure report sharing
CREATE TABLE public.shares (
  share_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES public.reports(report_id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES public.users(id) NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  permissions JSONB NOT NULL DEFAULT '{"view": true, "download": false}',
  expiration_date TIMESTAMP WITH TIME ZONE,
  email_restrictions JSONB DEFAULT '[]', -- Array of allowed emails
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table - Handles asynchronous workflows
CREATE TABLE public.jobs (
  job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type TEXT NOT NULL CHECK (job_type IN ('report_generation', 'investor_matching', 'scoring')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investor profiles table - For matching system (Sprint 2)
CREATE TABLE public.investors (
  investor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vc', 'pe', 'strategic', 'angel', 'family_office')),
  focus_areas JSONB DEFAULT '[]', -- Industries, stages, etc.
  investment_range_min BIGINT,
  investment_range_max BIGINT,
  geographic_focus JSONB DEFAULT '[]',
  criteria_weights JSONB DEFAULT '{}', -- Weighting for different assessment dimensions
  contact_info JSONB DEFAULT '{}',
  description TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investor matches table - Results of matching algorithm
CREATE TABLE public.investor_matches (
  match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES public.assessments(assessment_id) ON DELETE CASCADE NOT NULL,
  investor_id UUID REFERENCES public.investors(investor_id) NOT NULL,
  match_score DECIMAL(5,2) NOT NULL,
  match_reasoning JSONB DEFAULT '{}',
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assessments_advisor_id ON public.assessments(advisor_id);
CREATE INDEX idx_assessments_status ON public.assessments(status);
CREATE INDEX idx_assessments_created_at ON public.assessments(created_at);
CREATE INDEX idx_answers_assessment_id ON public.answers(assessment_id);
CREATE INDEX idx_answers_question_id ON public.answers(question_id);
CREATE INDEX idx_questions_dimension ON public.questions(dimension);
CREATE INDEX idx_questions_module ON public.questions(module);
CREATE INDEX idx_questions_order_index ON public.questions(order_index);
CREATE INDEX idx_shares_token ON public.shares(share_token);
CREATE INDEX idx_shares_active ON public.shares(is_active);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_type ON public.jobs(job_type);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id);

-- Advisors can see their own assessments, founders can see assessments they're invited to
CREATE POLICY assessments_advisor_access ON public.assessments FOR ALL USING (
  advisor_id = auth.uid() OR founder_id = auth.uid()
);

-- Answers are visible to assessment participants
CREATE POLICY answers_assessment_access ON public.answers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.assessments 
    WHERE assessment_id = answers.assessment_id 
    AND (advisor_id = auth.uid() OR founder_id = auth.uid())
  )
);

-- Reports follow assessment access patterns
CREATE POLICY reports_assessment_access ON public.reports FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.assessments 
    WHERE assessment_id = reports.assessment_id 
    AND (advisor_id = auth.uid() OR founder_id = auth.uid())
  )
);

-- Shares are accessible by creator or via valid token (handled in application)
CREATE POLICY shares_owner_access ON public.shares FOR ALL USING (shared_by_user_id = auth.uid());

-- Triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shares_updated_at BEFORE UPDATE ON public.shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();