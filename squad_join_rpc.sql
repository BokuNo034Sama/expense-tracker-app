-- Migration: Add join_squad_by_code RPC function (SECURITY DEFINER)
-- Allows authenticated users to safely join a squad via invite code without exposing broad SELECT permissions on the squads table.

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

  -- 6. Return the joined squad record
  RETURN v_squad;
END;
$$;

-- Revoke default public execution & grant strictly to authenticated users
REVOKE EXECUTE ON FUNCTION public.join_squad_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_squad_by_code(text) TO authenticated;
