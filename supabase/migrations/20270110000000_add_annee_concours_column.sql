-- ==============================================================================
-- MIGRATION: ADD ANNEE_CONCOURS COLUMN TO PROFILES TABLE
-- ==============================================================================

-- Add annee_concours column to public.profiles table if it does not exist yet
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS annee_concours TEXT;

-- Drop any restrictive check constraint on classe to ensure 'Autre' and graduation years work
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_classe_check;

-- Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
