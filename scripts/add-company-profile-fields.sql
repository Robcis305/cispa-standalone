-- Add company profile fields to assessments table
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS revenue BIGINT,
ADD COLUMN IF NOT EXISTS ebitda BIGINT,
ADD COLUMN IF NOT EXISTS revenue_period TEXT DEFAULT 'annual',
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS founded_year INTEGER;

-- Add comment for clarity
COMMENT ON COLUMN public.assessments.revenue IS 'Company revenue in USD';
COMMENT ON COLUMN public.assessments.ebitda IS 'Company EBITDA in USD';
COMMENT ON COLUMN public.assessments.revenue_period IS 'Revenue period: annual, quarterly, etc.';