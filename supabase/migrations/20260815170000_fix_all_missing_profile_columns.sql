-- Comprehensive schema fix for profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS year TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS height NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT,
  ADD COLUMN IF NOT EXISTS injuries TEXT,
  ADD COLUMN IF NOT EXISTS training_availability TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS points_total INTEGER DEFAULT 0;

-- Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
