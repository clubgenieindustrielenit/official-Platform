-- ==============================================================================
-- MIGRATION: FIX FORMATIONS, VISITES & CLUB PROJECTS COMPATIBILITY
-- ==============================================================================

-- 1. Relax NOT NULL constraint on activities.description
ALTER TABLE public.activities ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.activities ALTER COLUMN description SET DEFAULT '';

-- 2. Ensure all formation & visit columns exist on activities table
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS trainer_name TEXT,
  ADD COLUMN IF NOT EXISTS prerequisites TEXT,
  ADD COLUMN IF NOT EXISTS training_material_url TEXT,
  ADD COLUMN IF NOT EXISTS entreprise TEXT,
  ADD COLUMN IF NOT EXISTS google_form_url TEXT,
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS date_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS date_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT;




-- 4. Ensure RLS policies for activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select_all" ON public.activities;
CREATE POLICY "activities_select_all" ON public.activities 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "activities_auth_manage" ON public.activities;
CREATE POLICY "activities_auth_manage" ON public.activities 
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. Ensure RLS policies for projects and project members
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
CREATE POLICY "projects_select_all" ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "project_members_select_all" ON public.project_members;
CREATE POLICY "project_members_select_all" ON public.project_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "project_tasks_select_all" ON public.project_tasks;
CREATE POLICY "project_tasks_select_all" ON public.project_tasks FOR SELECT USING (true);
