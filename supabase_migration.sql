-- 1. Add missing streak and income columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS financial_streak      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_logged_date      DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_streak_this_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS income_type           TEXT DEFAULT 'salary',
  ADD COLUMN IF NOT EXISTS anchor_day            INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fluid_window_days     INTEGER DEFAULT NULL;

-- 2. Drop the broken CHECK constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_income_type_check;

-- 3. Recreate the CHECK constraint with correct lowercase values only
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_income_type_check
  CHECK (income_type IN ('salary', 'business', 'student'));
