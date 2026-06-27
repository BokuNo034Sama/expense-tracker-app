-- 1. Extend user profiles to track occupation metadata and daily streaks
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation VARCHAR(50) DEFAULT 'salary';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_streak_this_month INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_tracked_date DATE;

-- 2. Create the dynamic budget slices table
CREATE TABLE IF NOT EXISTS public.budget_slices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    slice_name VARCHAR(255) NOT NULL,
    slice_type VARCHAR(50) DEFAULT 'CUSTOM' NOT NULL,
    allocated_percentage INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- Turn on Row-Level Security (RLS) so users can only read/write their own categories
ALTER TABLE public.budget_slices ENABLE ROW LEVEL SECURITY;

-- Create access policies for individual profiles
CREATE POLICY "Users can create their own custom slices" 
ON public.budget_slices FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own custom slices" 
ON public.budget_slices FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own custom slices" 
ON public.budget_slices FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Drop the old restrictive check constraint safely and re-add supporting 'student', 'WEEKEND_SHIFT', 'FLUID_ROLLING'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_income_type_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_income_type_check 
CHECK (income_type IN ('salary', 'business', 'student', 'WEEKEND_SHIFT', 'FLUID_ROLLING'));

-- 4. Add push_subscription column to profiles for FCM push alerts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- 5. Create the monthly snapshots table
CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month_year VARCHAR(50) NOT NULL,
    total_income NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_expense NUMERIC(12, 2) NOT NULL DEFAULT 0,
    savings_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    top_category VARCHAR(255) NOT NULL DEFAULT 'None',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row-Level Security (RLS) so users can only read/write their own snapshots
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;

-- Create access policies for monthly snapshots
CREATE POLICY "Users can create their own monthly snapshots" 
ON public.monthly_snapshots FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own monthly snapshots" 
ON public.monthly_snapshots FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly snapshots" 
ON public.monthly_snapshots FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own monthly snapshots" 
ON public.monthly_snapshots FOR DELETE 
USING (auth.uid() = user_id);


