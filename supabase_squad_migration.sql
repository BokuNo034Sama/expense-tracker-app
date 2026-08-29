-- Migration: Squad Activity Log & Updated Join RPC
-- Table: public.squad_activity_log

CREATE TABLE IF NOT EXISTS public.squad_activity_log (
  id BIGSERIAL PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('joined', 'all_buckets_locked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying recent activity per squad
CREATE INDEX IF NOT EXISTS idx_squad_activity_log_squad 
  ON public.squad_activity_log(squad_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.squad_activity_log ENABLE ROW LEVEL SECURITY;

-- Squadmate SELECT policy
DROP POLICY IF EXISTS squad_activity_squadmate_select ON public.squad_activity_log;
CREATE POLICY squad_activity_squadmate_select ON public.squad_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_activity_log.squad_id
        AND sm.user_id = auth.uid()
    )
  );

-- Update join_squad_by_code RPC to insert activity log entry atomically
CREATE OR REPLACE FUNCTION public.join_squad_by_code(p_invite_code text)
RETURNS public.squads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_squad   public.squads%ROWTYPE;
  v_code    TEXT;
BEGIN
  -- 1. Ensure user is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized. You must be logged in to join a squad.';
  END IF;

  -- 2. Clean input code
  v_code := lower(trim(p_invite_code));
  IF v_code = '' OR v_code IS NULL THEN
    RAISE EXCEPTION 'Please provide a valid invite code.';
  END IF;

  -- 3. Lookup squad by invite code (case-insensitive)
  SELECT *
    INTO v_squad
    FROM public.squads
   WHERE lower(invite_code) = v_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Squad not found. Check the invite code and try again.';
  END IF;

  -- 4. Check if user is already a member
  IF EXISTS (
    SELECT 1
      FROM public.squad_members
     WHERE squad_id = v_squad.id
       AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You are already in this squad.';
  END IF;

  -- 5. Add user to squad_members
  INSERT INTO public.squad_members (squad_id, user_id, joined_at)
  VALUES (v_squad.id, v_user_id, now());

  -- 6. Insert activity log event
  INSERT INTO public.squad_activity_log (squad_id, user_id, event_type, created_at)
  VALUES (v_squad.id, v_user_id, 'joined', now());

  -- 7. Return the joined squad record
  RETURN v_squad;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_squad_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_squad_by_code(text) TO authenticated;
