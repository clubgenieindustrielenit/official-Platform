-- Ensure all roles are added to member_role ENUM type (if enum exists) and update profiles_role_check constraint safely
DO $$
BEGIN
  -- 1. Add missing enum values to public.member_role if the enum type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'membre_actif' AND enumtypid = 'public.member_role'::regtype) THEN
      ALTER TYPE public.member_role ADD VALUE 'membre_actif';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'membre_bureau' AND enumtypid = 'public.member_role'::regtype) THEN
      ALTER TYPE public.member_role ADD VALUE 'membre_bureau';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bureau' AND enumtypid = 'public.member_role'::regtype) THEN
      ALTER TYPE public.member_role ADD VALUE 'bureau';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'membre' AND enumtypid = 'public.member_role'::regtype) THEN
      ALTER TYPE public.member_role ADD VALUE 'membre';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pole_lead' AND enumtypid = 'public.member_role'::regtype) THEN
      ALTER TYPE public.member_role ADD VALUE 'pole_lead';
    END IF;
  END IF;

  -- 2. Handle profiles.role constraint safely
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

  -- Only add text check constraint if role column is text type (not enum)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'membre_bureau', 'membre_actif', 'bureau', 'membre', 'pole_lead'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;
