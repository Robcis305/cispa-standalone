export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'advisor' | 'founder' | 'admin'
          first_name: string | null
          last_name: string | null
          company_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'advisor' | 'founder' | 'admin'
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'advisor' | 'founder' | 'admin'
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          question_id: string
          question_text: string
          question_type: 'text' | 'number' | 'file_upload' | 'multiple_choice' | 'scale' | 'boolean'
          dimension: 'financial' | 'operational' | 'market' | 'technology' | 'legal' | 'strategic' | 'investor_profile' | 'fund_structure' | 'track_record' | 'value_add' | 'governance' | 'investment_philosophy' | 'cultural_fit' | 'negotiation' | 'reputation' | 'future_orientation' | 'trust' | 'communication' | 'decision_making' | 'founder_autonomy' | 'human_partnership' | 'relationship_potential' | 'self_awareness'
          module: 'core' | 'marketing' | 'technology' | 'human_capital' | 'investor'
          order_index: number
          branching_conditions: Record<string, unknown> | null
          weight: number
          scoring_impact: number
          options: QuestionOption[]
          validation_rules: Record<string, unknown> | null
          help_text: string | null
          is_required: boolean
          is_active: boolean
          is_core: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          question_id?: string
          question_text: string
          question_type: 'text' | 'number' | 'file_upload' | 'multiple_choice' | 'scale' | 'boolean'
          dimension: 'financial' | 'operational' | 'market' | 'technology' | 'legal' | 'strategic'
          module?: 'core' | 'marketing' | 'technology' | 'human_capital' | 'investor'
          order_index?: number
          branching_conditions?: Record<string, unknown> | null
          weight?: number
          scoring_impact?: number
          options?: QuestionOption[]
          validation_rules?: Record<string, unknown> | null
          help_text?: string | null
          is_required?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          question_id?: string
          question_text?: string
          question_type?: 'text' | 'number' | 'file_upload' | 'multiple_choice' | 'scale' | 'boolean'
          dimension?: 'financial' | 'operational' | 'market' | 'technology' | 'legal' | 'strategic' | 'investor_profile' | 'fund_structure' | 'track_record' | 'value_add' | 'governance' | 'investment_philosophy' | 'cultural_fit' | 'negotiation' | 'reputation' | 'future_orientation' | 'trust' | 'communication' | 'decision_making' | 'founder_autonomy' | 'human_partnership' | 'relationship_potential' | 'self_awareness'
          module?: 'core' | 'marketing' | 'technology' | 'human_capital' | 'investor'
          order_index?: number
          branching_conditions?: Record<string, unknown> | null
          weight?: number
          scoring_impact?: number
          options?: QuestionOption[]
          validation_rules?: Record<string, unknown> | null
          help_text?: string | null
          is_required?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assessments: {
        Row: {
          assessment_id: string
          title: string
          description: string | null
          company_name: string
          advisor_id: string
          founder_id: string | null
          template_type: string
          status: 'draft' | 'in_progress' | 'completed' | 'archived'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          timeline: string | null
          started_at: string | null
          completed_at: string | null
          time_to_completion: string | null
          current_question_id: string | null
          overall_readiness_score: number | null
          dimension_scores: Record<string, number> | null
          recommendations: Record<string, unknown>[]
          progress_percentage: number
          created_at: string
          updated_at: string
          // Company profile for investor matching
          industry: string | null
          annual_revenue: number | null
          funding_amount_sought: number | null
          investment_type: 'control' | 'minority' | 'either' | null
          company_stage: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'late_stage' | null
          geographic_location: string | null
          growth_rate: number | null
          business_model: 'b2b_saas' | 'b2c' | 'marketplace' | 'hardware' | 'biotech' | 'fintech' | 'other' | null
        }
        Insert: {
          assessment_id?: string
          title: string
          description?: string | null
          company_name: string
          advisor_id: string
          founder_id?: string | null
          template_type?: string
          status?: 'draft' | 'in_progress' | 'completed' | 'archived'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          timeline?: string | null
          started_at?: string | null
          completed_at?: string | null
          time_to_completion?: string | null
          current_question_id?: string | null
          overall_readiness_score?: number | null
          dimension_scores?: Record<string, number> | null
          recommendations?: Record<string, unknown>[]
          progress_percentage?: number
          created_at?: string
          updated_at?: string
          // Company profile for investor matching
          industry?: string | null
          annual_revenue?: number | null
          funding_amount_sought?: number | null
          investment_type?: 'control' | 'minority' | 'either' | null
          company_stage?: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'late_stage' | null
          geographic_location?: string | null
          growth_rate?: number | null
          business_model?: 'b2b_saas' | 'b2c' | 'marketplace' | 'hardware' | 'biotech' | 'fintech' | 'other' | null
        }
        Update: {
          assessment_id?: string
          title?: string
          description?: string | null
          company_name?: string
          advisor_id?: string
          founder_id?: string | null
          template_type?: string
          status?: 'draft' | 'in_progress' | 'completed' | 'archived'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          timeline?: string | null
          started_at?: string | null
          completed_at?: string | null
          time_to_completion?: string | null
          current_question_id?: string | null
          overall_readiness_score?: number | null
          dimension_scores?: Record<string, number> | null
          recommendations?: Record<string, unknown>[]
          progress_percentage?: number
          created_at?: string
          updated_at?: string
          // Company profile for investor matching
          industry?: string | null
          annual_revenue?: number | null
          funding_amount_sought?: number | null
          investment_type?: 'control' | 'minority' | 'either' | null
          company_stage?: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'late_stage' | null
          geographic_location?: string | null
          growth_rate?: number | null
          business_model?: 'b2b_saas' | 'b2c' | 'marketplace' | 'hardware' | 'biotech' | 'fintech' | 'other' | null
        }
      }
      answers: {
        Row: {
          answer_id: string
          assessment_id: string
          question_id: string
          answer_value: string
          answer_metadata: Record<string, unknown> | null
          score_impact: number | null
          created_at: string
          updated_at: string
          answered_by: string | null
        }
        Insert: {
          answer_id?: string
          assessment_id: string
          question_id: string
          answer_value: string
          answer_metadata?: Record<string, unknown> | null
          score_impact?: number | null
          created_at?: string
          updated_at?: string
          answered_by?: string | null
        }
        Update: {
          answer_id?: string
          assessment_id?: string
          question_id?: string
          answer_value?: string
          answer_metadata?: Record<string, unknown> | null
          score_impact?: number | null
          created_at?: string
          updated_at?: string
          answered_by?: string | null
        }
      }
      reports: {
        Row: {
          report_id: string
          assessment_id: string
          report_type: 'comprehensive' | 'summary' | 'executive'
          title: string
          file_path: string | null
          file_size: number | null
          file_format: string | null
          generation_status: 'pending' | 'generating' | 'completed' | 'failed'
          generation_started_at: string | null
          generation_completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          report_id?: string
          assessment_id: string
          report_type?: 'comprehensive' | 'summary' | 'executive'
          title: string
          file_path?: string | null
          file_size?: number | null
          file_format?: string | null
          generation_status?: 'pending' | 'generating' | 'completed' | 'failed'
          generation_started_at?: string | null
          generation_completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          report_id?: string
          assessment_id?: string
          report_type?: 'comprehensive' | 'summary' | 'executive'
          title?: string
          file_path?: string | null
          file_size?: number | null
          file_format?: string | null
          generation_status?: 'pending' | 'generating' | 'completed' | 'failed'
          generation_started_at?: string | null
          generation_completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shares: {
        Row: {
          share_id: string
          report_id: string
          shared_by_user_id: string
          share_token: string
          permissions: Record<string, unknown> | null
          expiration_date: string | null
          email_restrictions: string[]
          access_count: number
          last_accessed_at: string | null
          is_active: boolean
          revoked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          share_id?: string
          report_id: string
          shared_by_user_id: string
          share_token?: string
          permissions?: Record<string, unknown> | null
          expiration_date?: string | null
          email_restrictions?: string[]
          access_count?: number
          last_accessed_at?: string | null
          is_active?: boolean
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          share_id?: string
          report_id?: string
          shared_by_user_id?: string
          share_token?: string
          permissions?: Record<string, unknown> | null
          expiration_date?: string | null
          email_restrictions?: string[]
          access_count?: number
          last_accessed_at?: string | null
          is_active?: boolean
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          job_id: string
          job_type: 'report_generation' | 'investor_matching' | 'scoring'
          status: 'queued' | 'processing' | 'completed' | 'failed'
          input_data: Record<string, unknown> | null
          output_data: Record<string, unknown> | null
          error_message: string | null
          progress_percentage: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          job_id?: string
          job_type: 'report_generation' | 'investor_matching' | 'scoring'
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          input_data?: Record<string, unknown> | null
          output_data?: Record<string, unknown> | null
          error_message?: string | null
          progress_percentage?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          job_id?: string
          job_type?: 'report_generation' | 'investor_matching' | 'scoring'
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          input_data?: Record<string, unknown> | null
          output_data?: Record<string, unknown> | null
          error_message?: string | null
          progress_percentage?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      investors: {
        Row: {
          investor_id: string
          name: string
          type: 'vc' | 'pe' | 'strategic' | 'angel' | 'family_office'
          focus_areas: string[]
          investment_range_min: number | null
          investment_range_max: number | null
          geographic_focus: string[]
          criteria_weights: Record<string, number> | null
          contact_info: Record<string, unknown> | null
          description: string | null
          website: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          // Investor matching criteria
          preferred_industries: string[]
          preferred_revenue_range_min: number | null
          preferred_revenue_range_max: number | null
          preferred_investment_types: ('control' | 'minority' | 'either')[]
          preferred_company_stages: ('pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'late_stage')[]
          preferred_business_models: ('b2b_saas' | 'b2c' | 'marketplace' | 'hardware' | 'biotech' | 'fintech' | 'other')[]
          minimum_growth_rate: number | null
          match_score_threshold: number | null
        }
        Insert: {
          investor_id?: string
          name: string
          type: 'vc' | 'pe' | 'strategic' | 'angel' | 'family_office'
          focus_areas?: string[]
          investment_range_min?: number | null
          investment_range_max?: number | null
          geographic_focus?: string[]
          criteria_weights?: Record<string, number> | null
          contact_info?: Record<string, unknown> | null
          description?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          // Investor matching criteria
          preferred_industries?: string[]
          preferred_revenue_range_min?: number | null
          preferred_revenue_range_max?: number | null
          preferred_investment_types?: ('control' | 'minority' | 'either')[]
          preferred_company_stages?: ('pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'late_stage')[]
          preferred_business_models?: ('b2b_saas' | 'b2c' | 'marketplace' | 'hardware' | 'biotech' | 'fintech' | 'other')[]
          minimum_growth_rate?: number | null
          match_score_threshold?: number | null
        }
        Update: {
          investor_id?: string
          name?: string
          type?: 'vc' | 'pe' | 'strategic' | 'angel' | 'family_office'
          focus_areas?: string[]
          investment_range_min?: number | null
          investment_range_max?: number | null
          geographic_focus?: string[]
          criteria_weights?: Record<string, number> | null
          contact_info?: Record<string, unknown> | null
          description?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          // Investor matching criteria
          preferred_industries?: string[]
          preferred_revenue_range_min?: number | null
          preferred_revenue_range_max?: number | null
          preferred_investment_types?: ('control' | 'minority' | 'either')[]
          preferred_company_stages?: ('pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'late_stage')[]
          preferred_business_models?: ('b2b_saas' | 'b2c' | 'marketplace' | 'hardware' | 'biotech' | 'fintech' | 'other')[]
          minimum_growth_rate?: number | null
          match_score_threshold?: number | null
        }
      }
      investor_matches: {
        Row: {
          match_id: string
          assessment_id: string
          investor_id: string
          match_score: number
          match_reasoning: Record<string, unknown> | null
          rank_position: number | null
          created_at: string
        }
        Insert: {
          match_id?: string
          assessment_id: string
          investor_id: string
          match_score: number
          match_reasoning?: Record<string, unknown> | null
          rank_position?: number | null
          created_at?: string
        }
        Update: {
          match_id?: string
          assessment_id?: string
          investor_id?: string
          match_score?: number
          match_reasoning?: Record<string, unknown> | null
          rank_position?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Question = Database['public']['Tables']['questions']['Row']
export type Assessment = Database['public']['Tables']['assessments']['Row']
export type Answer = Database['public']['Tables']['answers']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type Investor = Database['public']['Tables']['investors']['Row']
export type User = Database['public']['Tables']['users']['Row']

export interface CompanyProfile {
  company_name: string
  industry: string | null
  annual_revenue: number | null
  funding_amount_sought: number | null
  investment_type: 'control' | 'minority' | 'either' | null
  company_stage: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'late_stage' | null
  geographic_location: string | null
  growth_rate: number | null
  business_model: 'b2b_saas' | 'b2c' | 'marketplace' | 'hardware' | 'biotech' | 'fintech' | 'other' | null
}

export interface QuestionOption {
  value: string
  label: string
  score: number
}