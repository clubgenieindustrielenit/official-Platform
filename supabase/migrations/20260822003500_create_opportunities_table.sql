-- Create opportunities table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stage_pfe', 'stage_ete', 'stage_ouvrier', 'emploi', 'autre')),
  location TEXT,
  description TEXT,
  requirements TEXT,
  deadline DATE,
  contact_email TEXT,
  apply_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "opportunities_select_active" ON public.opportunities;
CREATE POLICY "opportunities_select_active" ON public.opportunities FOR SELECT USING (true);

DROP POLICY IF EXISTS "opportunities_all_admin" ON public.opportunities;
CREATE POLICY "opportunities_all_admin" ON public.opportunities FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'membre_bureau', 'bureau'))
    OR created_by = auth.uid()
  );
