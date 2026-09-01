-- ==============================================================================
-- MIGRATION: FIX RESOURCES POLE_ID & ACTIVITIES PROFILES FOREIGN KEY
-- ==============================================================================

-- 1. Fix resources table columns & foreign keys
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS pole_id UUID REFERENCES public.poles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID;




-- Ensure resources has clean foreign keys to profiles
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_uploaded_by_fkey;
ALTER TABLE public.resources ADD CONSTRAINT resources_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Fix activities foreign key to profiles
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_created_by_fkey;
ALTER TABLE public.activities ADD CONSTRAINT activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
