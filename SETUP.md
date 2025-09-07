# CISPA Platform Setup Guide

This guide will help you set up the CISPA Platform locally and deploy the database schema.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git

## 1. Environment Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Robcis305/cispa-standalone
   cd cispa-standalone
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure your `.env.local` file:**
   ```bash
   # Get these from your Supabase project settings
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Optional: For future features
   OPENAI_API_KEY=your-openai-key
   ```

## 2. Supabase Database Setup

### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Apply the database schema:**
   ```bash
   supabase db push
   ```

### Option B: Manual Setup via Supabase Dashboard

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `supabase/schema.sql`**
4. **Run the schema migration**
5. **Copy and paste the contents of `supabase/seed.sql`**
6. **Run the seed data**

## 3. Authentication Setup

1. **In your Supabase dashboard, go to Authentication > Settings**
2. **Set up your site URL:**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

3. **Enable email provider or set up additional auth providers as needed**

## 4. Row Level Security (RLS)

The schema automatically sets up RLS policies, but verify in your Supabase dashboard:

1. **Go to Authentication > Policies**
2. **Ensure policies are enabled for all tables**
3. **Test policies work correctly**

## 5. Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser to:**
   ```
   http://localhost:3000
   ```

## 6. Testing the Setup

### Create a Test User

1. Go to `http://localhost:3000`
2. Click "Get Started" to go to login page
3. Sign up with an email address
4. Check your email for verification (if email auth is enabled)

### Test Assessment Flow

1. **Create Assessment:**
   - Go to Dashboard
   - Click "New Assessment"
   - Fill out the form
   - Create assessment

2. **Take Assessment:**
   - Answer the 30 core questions
   - Complete the assessment

3. **View Results:**
   - Review dimension scores
   - Check recommendations
   - Verify results page works

## 7. Database Verification

### Check Tables

In your Supabase SQL editor, run:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check questions were seeded
SELECT dimension, COUNT(*) as question_count 
FROM questions 
WHERE module = 'core' 
GROUP BY dimension 
ORDER BY dimension;

-- Check sample data
SELECT name, type FROM investors LIMIT 5;
```

## 8. Common Issues

### Authentication Issues
- Make sure your Supabase URL and keys are correct
- Verify your site URL is set properly in Supabase dashboard
- Check that RLS policies allow your operations

### Database Connection Issues
- Verify your Supabase project is active
- Check that the schema was applied successfully
- Ensure your service role key has the right permissions

### Missing Data
- Run the seed.sql file if questions or investors are missing
- Check that the migration completed successfully

## 9. Next Steps

Once setup is complete, you can:

1. **Customize Questions:** Modify questions in the database
2. **Add Modules:** Extend with marketing, technology, and investor modules
3. **Implement Report Generation:** Build PDF generation system
4. **Add Investor Matching:** Implement the matching algorithm
5. **Set up Sharing:** Add secure report sharing functionality

## 10. Deployment

### Vercel Deployment

1. **Connect your GitHub repo to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy**

### Supabase Production

1. **Create a production Supabase project**
2. **Run migrations on production database**
3. **Update environment variables**

## Database Schema Overview

The current schema includes:

- **users**: Extended user profiles
- **assessments**: Master assessment records
- **questions**: 30 core questions across 6 dimensions
- **answers**: User responses to questions
- **reports**: Generated assessment reports (ready for implementation)
- **shares**: Secure sharing system (ready for implementation)
- **investors**: Sample investor database for matching
- **investor_matches**: Results of matching algorithm
- **jobs**: Async job processing

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Ensure database schema and seed data are properly applied

The platform is now ready for Sprint 1 functionality:
- ✅ Complete assessments in under 2 hours
- ✅ Generate scores and basic recommendations
- 🔄 Report generation (ready for implementation)
- 🔄 Secure sharing (ready for implementation)