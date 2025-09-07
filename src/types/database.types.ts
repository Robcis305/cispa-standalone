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
          dimension: 'financial' | 'operational' | 'market' | 'technology' | 'legal' | 'strategic'
          module: 'core' | 'marketing' | 'technology' | 'human_capital' | 'investor'
          order_index: number
          branching_conditions: any
          weight: number
          scoring_impact: number
          options: any[]
          validation_rules: any
          help_text: string | null
          is_required: boolean
          is_active: boolean
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
          branching_conditions?: any
          weight?: number
          scoring_impact?: number
          options?: any[]
          validation_rules?: any
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
          dimension?: 'financial' | 'operational' | 'market' | 'technology' | 'legal' | 'strategic'
          module?: 'core' | 'marketing' | 'technology' | 'human_capital' | 'investor'
          order_index?: number
          branching_conditions?: any
          weight?: number
          scoring_impact?: number
          options?: any[]
          validation_rules?: any
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
          dimension_scores: any
          recommendations: any[]
          progress_percentage: number
          created_at: string
          updated_at: string
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
          dimension_scores?: any
          recommendations?: any[]
          progress_percentage?: number
          created_at?: string
          updated_at?: string
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
          dimension_scores?: any
          recommendations?: any[]
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      answers: {
        Row: {
          answer_id: string
          assessment_id: string
          question_id: string
          answer_value: string
          answer_metadata: any
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
          answer_metadata?: any
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
          answer_metadata?: any
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
          permissions: any
          expiration_date: string | null
          email_restrictions: any[]
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
          permissions?: any
          expiration_date?: string | null
          email_restrictions?: any[]
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
          permissions?: any
          expiration_date?: string | null
          email_restrictions?: any[]
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
          input_data: any
          output_data: any
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
          input_data?: any
          output_data?: any
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
          input_data?: any
          output_data?: any
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
          focus_areas: any[]
          investment_range_min: number | null
          investment_range_max: number | null
          geographic_focus: any[]
          criteria_weights: any
          contact_info: any
          description: string | null
          website: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          investor_id?: string
          name: string
          type: 'vc' | 'pe' | 'strategic' | 'angel' | 'family_office'
          focus_areas?: any[]
          investment_range_min?: number | null
          investment_range_max?: number | null
          geographic_focus?: any[]
          criteria_weights?: any
          contact_info?: any
          description?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          investor_id?: string
          name?: string
          type?: 'vc' | 'pe' | 'strategic' | 'angel' | 'family_office'
          focus_areas?: any[]
          investment_range_min?: number | null
          investment_range_max?: number | null
          geographic_focus?: any[]
          criteria_weights?: any
          contact_info?: any
          description?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      investor_matches: {
        Row: {
          match_id: string
          assessment_id: string
          investor_id: string
          match_score: number
          match_reasoning: any
          rank_position: number | null
          created_at: string
        }
        Insert: {
          match_id?: string
          assessment_id: string
          investor_id: string
          match_score: number
          match_reasoning?: any
          rank_position?: number | null
          created_at?: string
        }
        Update: {
          match_id?: string
          assessment_id?: string
          investor_id?: string
          match_score?: number
          match_reasoning?: any
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

export interface QuestionOption {
  value: string
  label: string
  score: number
}