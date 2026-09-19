-- ==============================================================================
-- MIGRATION: DROP RESTRICTIVE PROFILES CLASSE CHECK CONSTRAINT
-- ==============================================================================

-- Drop the restrictive check constraint on public.profiles.classe
-- to allow 'Autre', graduation years (e.g. 1970, 2024), 'Alumni', and custom classes.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_classe_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_prepa_section_check;

NOTIFY pgrst, 'reload schema';

