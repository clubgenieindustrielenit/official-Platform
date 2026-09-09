-- ============================================================
-- Migration: Fix member_role enum + handle_new_user trigger
-- ============================================================
-- Problem 1: The member_role enum was missing French role values
--   ('membre_actif', 'membre_bureau', 'bureau') used throughout
--   the codebase and RLS policies, causing silent update failures.
-- Problem 2: The handle_new_user trigger hardcoded 'member' as
--   the default role instead of reading it from user metadata,
--   meaning invited roles (e.g. 'membre_bureau') were overridden.
-- ============================================================

-- 1. Add missing enum values (IF NOT EXISTS is safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'membre_actif'
      AND enumtypid = 'public.member_role'::regtype
  ) THEN
    ALTER TYPE public.member_role ADD VALUE 'membre_actif';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'membre_bureau'
      AND enumtypid = 'public.member_role'::regtype
  ) THEN
    ALTER TYPE public.member_role ADD VALUE 'membre_bureau';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'bureau'
      AND enumtypid = 'public.member_role'::regtype
  ) THEN
    ALTER TYPE public.member_role ADD VALUE 'bureau';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'membre'
      AND enumtypid = 'public.member_role'::regtype
  ) THEN
    ALTER TYPE public.member_role ADD VALUE 'membre';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'pole_lead'
      AND enumtypid = 'public.member_role'::regtype
  ) THEN
    ALTER TYPE public.member_role ADD VALUE 'pole_lead';
  END IF;
END;
$$;

-- 2. Fix handle_new_user trigger: read role from user metadata
--    instead of hardcoding 'member'. Falls back to 'membre_actif'
--    if no role is present in metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
DECLARE
  v_role public.member_role;
BEGIN
  -- Try to cast the role from metadata; fall back to 'membre_actif'
  BEGIN
    v_role := (NEW.raw_user_meta_data ->> 'role')::public.member_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'membre_actif'::public.member_role;
  END;

  IF v_role IS NULL THEN
    v_role := 'membre_actif'::public.member_role;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    points_total
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    v_role,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;
