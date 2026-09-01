-- 1. Types
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('planned', 'in_progress', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  pole_id UUID REFERENCES public.poles(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.project_status NOT NULL DEFAULT 'planned',
  deadline DATE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Project Members Table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  points_awarded BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (project_id, user_id)
);

-- 4. Project Tasks Table
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status public.task_status NOT NULL DEFAULT 'todo',
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Link related_project_id in points_log if column exists or add it
DO $$ BEGIN
  ALTER TABLE public.points_log ADD COLUMN IF NOT EXISTS related_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
EXCEPTION
  WHEN others THEN null;
END $$;

-- 6. Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- 7. Policies
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
CREATE POLICY "projects_select_all" ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "projects_all_admin_or_lead" ON public.projects;
CREATE POLICY "projects_all_admin_or_lead" ON public.projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'membre_bureau', 'bureau'))
    OR lead_id = auth.uid()
  );

DROP POLICY IF EXISTS "project_members_select_all" ON public.project_members;
CREATE POLICY "project_members_select_all" ON public.project_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "project_members_all_admin_or_lead" ON public.project_members;
CREATE POLICY "project_members_all_admin_or_lead" ON public.project_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'membre_bureau', 'bureau'))
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_members.project_id AND p.lead_id = auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "project_tasks_select_all" ON public.project_tasks;
CREATE POLICY "project_tasks_select_all" ON public.project_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "project_tasks_all_members" ON public.project_tasks;
CREATE POLICY "project_tasks_all_members" ON public.project_tasks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'membre_bureau', 'bureau'))
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_tasks.project_id AND p.lead_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_tasks.project_id AND pm.user_id = auth.uid())
  );
