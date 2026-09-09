-- Add avatar_url, year, and missing profile columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS year TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS height NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT,
  ADD COLUMN IF NOT EXISTS injuries TEXT,
  ADD COLUMN IF NOT EXISTS training_availability TEXT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
