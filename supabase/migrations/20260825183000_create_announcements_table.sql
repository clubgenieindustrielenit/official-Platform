-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text,
  content text,
  pinned boolean DEFAULT false NOT NULL,
  pole_id uuid REFERENCES public.poles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.announcements TO anon;
GRANT ALL ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

DROP POLICY IF EXISTS "announcements_public_read" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_all" ON public.announcements;
CREATE POLICY "announcements_public_read"
ON public.announcements
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "announcements_admin_insert" ON public.announcements;
CREATE POLICY "announcements_admin_insert"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role::text IN ('admin', 'membre_bureau', 'bureau')
  )
);

DROP POLICY IF EXISTS "announcements_admin_modify" ON public.announcements;
CREATE POLICY "announcements_admin_modify"
ON public.announcements
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role::text IN ('admin', 'membre_bureau', 'bureau')
  )
);
