-- 1. Extend user profiles to track occupation metadata and daily streaks
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation VARCHAR(50) DEFAULT 'salary';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_streak_this_month INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_tracked_date DATE;

-- 2. Create the dynamic budget slices table
CREATE TABLE IF NOT EXISTS budget_slices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slice_name VARCHAR(100) NOT NULL,
    slice_type VARCHAR(50) NOT NULL, -- 'Basic', 'Handout', 'Feeding', 'Flex_Money', 'Saving', 'Custom'
    allocated_percentage INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for budget_slices
ALTER TABLE budget_slices ENABLE ROW LEVEL SECURITY;

-- Create policies for budget_slices
CREATE POLICY "Users can view their own budget slices"
    ON budget_slices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget slices"
    ON budget_slices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget slices"
    ON budget_slices FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget slices"
    ON budget_slices FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Drop the old restrictive check constraint safely and re-add supporting 'student', 'WEEKEND_SHIFT', 'FLUID_ROLLING'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_income_type_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_income_type_check 
CHECK (income_type IN ('salary', 'business', 'student', 'WEEKEND_SHIFT', 'FLUID_ROLLING'));

