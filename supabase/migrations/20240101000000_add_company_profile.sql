-- Add company profile columns to assessments table for investor matching
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS annual_revenue BIGINT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS funding_amount_sought BIGINT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS investment_type TEXT CHECK (investment_type IN ('control', 'minority', 'either'));
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS company_stage TEXT CHECK (company_stage IN ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'late_stage'));
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS geographic_location TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS growth_rate DECIMAL(5,2);
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS business_model TEXT CHECK (business_model IN ('b2b_saas', 'b2c', 'marketplace', 'hardware', 'biotech', 'fintech', 'other'));
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS ebitda BIGINT;