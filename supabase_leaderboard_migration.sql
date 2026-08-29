-- Migration: Add Leaderboard Feature (weekly_scores table, profiles column & RLS policies)
-- Kiny Personal Finance OS

-- 1. Add global leaderboard opt-in flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS global_leaderboard_opt_in BOOLEAN NOT NULL DEFAULT false;

-- 2. Create weekly_scores table
CREATE TABLE IF NOT EXISTS public.weekly_scores (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  distinct_log_days INT NOT NULL DEFAULT 0,
  total_capped_slices INT NOT NULL DEFAULT 0,
  logging_consistency NUMERIC(5,2) NOT NULL DEFAULT 0,
  budget_adherence NUMERIC(5,2) NOT NULL DEFAULT 0,
  composite_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_ranked BOOLEAN NOT NULL DEFAULT false,
  is_final BOOLEAN NOT NULL DEFAULT false,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start_date)
);

-- 3. Indexes for fast leaderboard querying and ranking
CREATE INDEX IF NOT EXISTS idx_weekly_scores_week ON public.weekly_scores(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_ranking ON public.weekly_scores(week_start_date, is_ranked, composite_score DESC, logging_consistency DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.weekly_scores ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS weekly_scores_self_select ON public.weekly_scores;
CREATE POLICY weekly_scores_self_select ON public.weekly_scores
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS weekly_scores_squadmate_select ON public.weekly_scores;
CREATE POLICY weekly_scores_squadmate_select ON public.weekly_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm1
      JOIN public.squad_members sm2 ON sm1.squad_id = sm2.squad_id
      WHERE sm1.user_id = auth.uid()
        AND sm2.user_id = weekly_scores.user_id
    )
  );

DROP POLICY IF EXISTS weekly_scores_global_select ON public.weekly_scores;
CREATE POLICY weekly_scores_global_select ON public.weekly_scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.global_leaderboard_opt_in = true)
    AND EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = weekly_scores.user_id AND p2.global_leaderboard_opt_in = true)
  );
