-- ==============================================================================
-- MIGRATION: FIX VISITES, STORAGE POLICIES AND DYNAMIC PROFILE POINTS SYNC
-- ==============================================================================

-- 1. Extend activities table for full compatibility with visits & events
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS date_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS date_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT;




-- 2. Setup Storage RLS Policies for buckets: resources, avatars, cvs, activities
DROP POLICY IF EXISTS "Public Read resources" ON storage.objects;
CREATE POLICY "Public Read resources" ON storage.objects FOR SELECT USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Authenticated Upload resources" ON storage.objects;
CREATE POLICY "Authenticated Upload resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update resources" ON storage.objects;
CREATE POLICY "Authenticated Update resources" ON storage.objects FOR UPDATE USING (bucket_id = 'resources' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Delete resources" ON storage.objects;
CREATE POLICY "Authenticated Delete resources" ON storage.objects FOR DELETE USING (bucket_id = 'resources' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public Read avatars" ON storage.objects;
CREATE POLICY "Public Read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated Upload avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update avatars" ON storage.objects;
CREATE POLICY "Authenticated Update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public Read cvs" ON storage.objects;
CREATE POLICY "Public Read cvs" ON storage.objects FOR SELECT USING (bucket_id = 'cvs');

DROP POLICY IF EXISTS "Authenticated Upload cvs" ON storage.objects;
CREATE POLICY "Authenticated Upload cvs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cvs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update cvs" ON storage.objects;
CREATE POLICY "Authenticated Update cvs" ON storage.objects FOR UPDATE USING (bucket_id = 'cvs' AND auth.role() = 'authenticated');

-- 3. Dynamic Profile Completion / Edition Points Trigger
DROP FUNCTION IF EXISTS public.award_profile_completion_points();
CREATE OR REPLACE FUNCTION public.award_profile_completion_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pts_delta INTEGER := 0;
BEGIN
  -- 1. Photo de profil (avatar_url) -> +/- 5 pts
  IF (OLD.avatar_url IS NULL OR OLD.avatar_url = '') AND (NEW.avatar_url IS NOT NULL AND NEW.avatar_url <> '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : Photo de profil ajoutée');
    v_pts_delta := v_pts_delta + 5;
  ELSIF (OLD.avatar_url IS NOT NULL AND OLD.avatar_url <> '') AND (NEW.avatar_url IS NULL OR NEW.avatar_url = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, -5, 'Profil modifié : Photo de profil supprimée');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- 2. CV (cv_url) -> +/- 10 pts
  IF (OLD.cv_url IS NULL OR OLD.cv_url = '') AND (NEW.cv_url IS NOT NULL AND NEW.cv_url <> '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 10, 'Profil complété : CV ajouté');
    v_pts_delta := v_pts_delta + 10;
  ELSIF (OLD.cv_url IS NOT NULL AND OLD.cv_url <> '') AND (NEW.cv_url IS NULL OR NEW.cv_url = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, -10, 'Profil modifié : CV supprimé');
    v_pts_delta := v_pts_delta - 10;
  END IF;

  -- 3. LinkedIn (linkedin_url) -> +/- 5 pts
  IF (OLD.linkedin_url IS NULL OR OLD.linkedin_url = '') AND (NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url <> '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : LinkedIn ajouté');
    v_pts_delta := v_pts_delta + 5;
  ELSIF (OLD.linkedin_url IS NOT NULL AND OLD.linkedin_url <> '') AND (NEW.linkedin_url IS NULL OR NEW.linkedin_url = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, -5, 'Profil modifié : LinkedIn supprimé');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- 4. Section prépa (prepa_section) -> +/- 5 pts
  IF (OLD.prepa_section IS NULL OR OLD.prepa_section = '') AND (NEW.prepa_section IS NOT NULL AND NEW.prepa_section <> '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : Section prépa renseignée');
    v_pts_delta := v_pts_delta + 5;
  ELSIF (OLD.prepa_section IS NOT NULL AND OLD.prepa_section <> '') AND (NEW.prepa_section IS NULL OR NEW.prepa_section = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, -5, 'Profil modifié : Section prépa supprimée');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- 5. Établissement prépa (prepa_etablissement) -> +/- 5 pts
  IF (OLD.prepa_etablissement IS NULL OR OLD.prepa_etablissement = '') AND (NEW.prepa_etablissement IS NOT NULL AND NEW.prepa_etablissement <> '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : Établissement prépa renseigné');
    v_pts_delta := v_pts_delta + 5;
  ELSIF (OLD.prepa_etablissement IS NOT NULL AND OLD.prepa_etablissement <> '') AND (NEW.prepa_etablissement IS NULL OR NEW.prepa_etablissement = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, -5, 'Profil modifié : Établissement prépa supprimé');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- 6. Rang concours (rang_concours) -> +/- 5 pts
  IF OLD.rang_concours IS NULL AND NEW.rang_concours IS NOT NULL THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : Rang concours renseigné');
    v_pts_delta := v_pts_delta + 5;
  ELSIF OLD.rang_concours IS NOT NULL AND NEW.rang_concours IS NULL THEN
    INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, -5, 'Profil modifié : Rang concours supprimé');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- Appliquer le delta sur points_total sans jamais passer sous 0
  IF v_pts_delta <> 0 THEN
    NEW.points_total := GREATEST(0, COALESCE(NEW.points_total, 0) + v_pts_delta);
  END IF;

  -- Complétion initiale
  IF NEW.phone IS NOT NULL AND NEW.phone <> ''
     AND NEW.classe IS NOT NULL AND NEW.classe <> ''
     AND NEW.statut_membre IS NOT NULL AND NEW.statut_membre <> ''
     AND NEW.profile_completed_at IS NULL THEN
    NEW.profile_completed_at := now();
  END IF;

  RETURN NEW;
END;
$$;
