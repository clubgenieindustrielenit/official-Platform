-- ==============================================================================
-- MIGRATION: DROP RESTRICTIVE PROFILES CLASSE CHECK CONSTRAINT
-- ==============================================================================

-- Drop the restrictive check constraint on public.profiles.classe
-- to allow 'Autre', graduation years (e.g. 1970, 2024), 'Alumni', and custom classes.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_classe_check;

-- Optional: Add a flexible constraint allowing non-empty strings if needed
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_classe_check CHECK (classe IS NULL OR TRIM(classe) <> '');

NOTIFY pgrst, 'reload schema';
