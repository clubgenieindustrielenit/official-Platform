-- MIGRATION: 4 Official Poles Harmonization and Multi-Pole Member Assignment

-- 1. Ensure pole_ids column exists on profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pole_ids UUID[] DEFAULT '{}'::UUID[];

-- 2. Backfill pole_ids from existing pole_id where pole_id is not null
UPDATE public.profiles
SET pole_ids = ARRAY[pole_id]
WHERE pole_id IS NOT NULL 
  AND (pole_ids IS NULL OR cardinality(pole_ids) = 0);

-- 3. Harmonize the 4 official poles in public.poles
-- Update existing poles or insert them if missing

-- Pôle 1: Partenariats & Sponsoring
UPDATE public.poles
SET 
  name = 'Partenariats & Sponsoring',
  description = 'Relations industrielles, entreprises et sponsoring',
  color = '#fca311',
  icon = 'Handshake'
WHERE id = 'e9b29f89-10e9-4f80-95de-e747d7399414'
   OR name ILIKE '%partenariat%' 
   OR name ILIKE '%sponsoring%';

-- Pôle 2: Logistique & Événements
UPDATE public.poles
SET 
  name = 'Logistique & Événements',
  description = 'Organisation logistique et coordination des événements',
  color = '#3b82f6',
  icon = 'Calendar'
WHERE id = '341533b5-3c4e-4707-99af-1a49ee43d4cd'
   OR name ILIKE '%logistique%' 
   OR name ILIKE '%événement%'
   OR name ILIKE '%evenement%';

-- Pôle 3: Projets
UPDATE public.poles
SET 
  name = 'Projets',
  description = 'Gestion et développement des projets techniques et d''ingénierie',
  color = '#10b981',
  icon = 'FolderKanban'
WHERE id = '198c7343-4d7b-4d55-b6d1-004cb5391c6b'
   OR (name ILIKE '%projet%' AND name NOT ILIKE '%partenariat%')
   OR name ILIKE '%production%';

-- Pôle 4: Formations
UPDATE public.poles
SET 
  name = 'Formations',
  description = 'Formations techniques, ateliers et développement des compétences',
  color = '#a855f7',
  icon = 'GraduationCap'
WHERE id = '673a8a34-abe5-4b12-a79b-7ed2df877296'
   OR name ILIKE '%formation%' 
   OR name ILIKE '%qualité%'
   OR name ILIKE '%qualite%';

-- Ensure any poles outside the 4 official ones are cleaned up or aligned
DELETE FROM public.poles 
WHERE name NOT IN ('Partenariats & Sponsoring', 'Logistique & Événements', 'Projets', 'Formations');

-- Insert any missing official pole if it doesn't exist
INSERT INTO public.poles (name, description, color, icon)
SELECT 'Partenariats & Sponsoring', 'Relations industrielles, entreprises et sponsoring', '#fca311', 'Handshake'
WHERE NOT EXISTS (SELECT 1 FROM public.poles WHERE name = 'Partenariats & Sponsoring');

INSERT INTO public.poles (name, description, color, icon)
SELECT 'Logistique & Événements', 'Organisation logistique et coordination des événements', '#3b82f6', 'Calendar'
WHERE NOT EXISTS (SELECT 1 FROM public.poles WHERE name = 'Logistique & Événements');

INSERT INTO public.poles (name, description, color, icon)
SELECT 'Projets', 'Gestion et développement des projets techniques et d''ingénierie', '#10b981', 'FolderKanban'
WHERE NOT EXISTS (SELECT 1 FROM public.poles WHERE name = 'Projets');

INSERT INTO public.poles (name, description, color, icon)
SELECT 'Formations', 'Formations techniques, ateliers et développement des compétences', '#a855f7', 'GraduationCap'
WHERE NOT EXISTS (SELECT 1 FROM public.poles WHERE name = 'Formations');

-- 4. Create an index on pole_ids for fast filtering
CREATE INDEX IF NOT EXISTS idx_profiles_pole_ids ON public.profiles USING GIN (pole_ids);
