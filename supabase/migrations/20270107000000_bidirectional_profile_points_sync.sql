-- ==============================================================================
-- MIGRATION: BIDIRECTIONAL PROFILE POINTS SYNC & HISTORY LOGGING
-- ==============================================================================

-- 1. Ensure columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points_total INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS annee_concours TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_availability TEXT;

-- 2. Ensure points_log table exists and has proper indexes
CREATE TABLE IF NOT EXISTS public.points_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_points_log_user_id ON public.points_log(user_id);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON public.points_log(created_at DESC);

-- 3. Replace trigger function to handle both ADDITIONS (+) and DEDUCTIONS (-) across all 7 profile fields
CREATE OR REPLACE FUNCTION public.award_profile_completion_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pts_delta INTEGER := 0;
BEGIN
  -- ───────────────────────────────────────────────────────────────────────────
  -- 1. Photo de profil (avatar_url) -> +/- 5 pts
  -- ───────────────────────────────────────────────────────────────────────────
  IF (NEW.avatar_url IS NOT NULL AND TRIM(NEW.avatar_url) <> '') 
     AND (OLD.avatar_url IS NULL OR TRIM(OLD.avatar_url) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, 5, 'Profil complété : Photo de profil');
    v_pts_delta := v_pts_delta + 5;
  ELSIF (OLD.avatar_url IS NOT NULL AND TRIM(OLD.avatar_url) <> '') 
        AND (NEW.avatar_url IS NULL OR TRIM(NEW.avatar_url) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, -5, 'Profil modifié : Photo de profil supprimée');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 2. CV (cv_url) -> +/- 10 pts
  -- ───────────────────────────────────────────────────────────────────────────
  IF (NEW.cv_url IS NOT NULL AND TRIM(NEW.cv_url) <> '') 
     AND (OLD.cv_url IS NULL OR TRIM(OLD.cv_url) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, 10, 'Profil complété : CV ajouté');
    v_pts_delta := v_pts_delta + 10;
  ELSIF (OLD.cv_url IS NOT NULL AND TRIM(OLD.cv_url) <> '') 
        AND (NEW.cv_url IS NULL OR TRIM(NEW.cv_url) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, -10, 'Profil modifié : CV supprimé');
    v_pts_delta := v_pts_delta - 10;
  END IF;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 3. LinkedIn (linkedin_url) -> +/- 5 pts
  -- ───────────────────────────────────────────────────────────────────────────
  IF (NEW.linkedin_url IS NOT NULL AND TRIM(NEW.linkedin_url) <> '') 
     AND (OLD.linkedin_url IS NULL OR TRIM(OLD.linkedin_url) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, 5, 'Profil complété : LinkedIn ajouté');
    v_pts_delta := v_pts_delta + 5;
  ELSIF (OLD.linkedin_url IS NOT NULL AND TRIM(OLD.linkedin_url) <> '') 
        AND (NEW.linkedin_url IS NULL OR TRIM(NEW.linkedin_url) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, -5, 'Profil modifié : LinkedIn supprimé');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 4. Section Prépa (prepa_section) -> +/- 5 pts
  -- ───────────────────────────────────────────────────────────────────────────
  IF (NEW.prepa_section IS NOT NULL AND TRIM(NEW.prepa_section) <> '') 
     AND (OLD.prepa_section IS NULL OR TRIM(OLD.prepa_section) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, 5, 'Profil complété : Section prépa renseignée');
    v_pts_delta := v_pts_delta + 5;
  ELSIF (OLD.prepa_section IS NOT NULL AND TRIM(OLD.prepa_section) <> '') 
        AND (NEW.prepa_section IS NULL OR TRIM(NEW.prepa_section) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, -5, 'Profil modifié : Section prépa supprimée');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 5. Établissement Prépa (prepa_etablissement) -> +/- 5 pts
  -- ───────────────────────────────────────────────────────────────────────────
  IF (NEW.prepa_etablissement IS NOT NULL AND TRIM(NEW.prepa_etablissement) <> '') 
     AND (OLD.prepa_etablissement IS NULL OR TRIM(OLD.prepa_etablissement) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, 5, 'Profil complété : Établissement prépa renseigné');
    v_pts_delta := v_pts_delta + 5;
  ELSIF (OLD.prepa_etablissement IS NOT NULL AND TRIM(OLD.prepa_etablissement) <> '') 
        AND (NEW.prepa_etablissement IS NULL OR TRIM(NEW.prepa_etablissement) = '') THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, -5, 'Profil modifié : Établissement prépa supprimé');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 6. Rang Concours (rang_concours) -> +/- 5 pts
  -- ───────────────────────────────────────────────────────────────────────────
  IF NEW.rang_concours IS NOT NULL AND OLD.rang_concours IS NULL THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, 5, 'Profil complété : Rang concours renseigné');
    v_pts_delta := v_pts_delta + 5;
  ELSIF NEW.rang_concours IS NULL AND OLD.rang_concours IS NOT NULL THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, -5, 'Profil modifié : Rang concours supprimé');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 7. Année Concours (annee_concours or bio) -> +/- 5 pts
  -- ───────────────────────────────────────────────────────────────────────────
  IF (
       (NEW.annee_concours IS NOT NULL AND TRIM(NEW.annee_concours) <> '') OR
       (NEW.bio IS NOT NULL AND TRIM(NEW.bio) <> '')
     ) AND (
       (OLD.annee_concours IS NULL OR TRIM(OLD.annee_concours) = '') AND
       (OLD.bio IS NULL OR TRIM(OLD.bio) = '')
     ) THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, 5, 'Profil complété : Année de concours renseignée');
    v_pts_delta := v_pts_delta + 5;
  ELSIF (
       (OLD.annee_concours IS NOT NULL AND TRIM(OLD.annee_concours) <> '') OR
       (OLD.bio IS NOT NULL AND TRIM(OLD.bio) <> '')
     ) AND (
       (NEW.annee_concours IS NULL OR TRIM(NEW.annee_concours) = '') AND
       (NEW.bio IS NULL OR TRIM(NEW.bio) = '')
     ) THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, -5, 'Profil modifié : Année de concours supprimée');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- ───────────────────────────────────────────────────────────────────────────
  -- Apply delta to points_total safely without going below 0
  -- ───────────────────────────────────────────────────────────────────────────
  IF v_pts_delta <> 0 THEN
    NEW.points_total := GREATEST(0, COALESCE(NEW.points_total, 0) + v_pts_delta);
  END IF;

  -- Enregistrement de la date de complétion
  IF NEW.phone IS NOT NULL AND TRIM(NEW.phone) <> ''
     AND NEW.classe IS NOT NULL AND TRIM(NEW.classe) <> ''
     AND NEW.statut_membre IS NOT NULL AND TRIM(NEW.statut_membre) <> ''
     AND NEW.profile_completed_at IS NULL THEN
    NEW.profile_completed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Re-bind the single trigger to public.profiles
DROP TRIGGER IF EXISTS trg_award_profile_completion_points ON public.profiles;
DROP TRIGGER IF EXISTS trg_award_profile_points ON public.profiles;
CREATE TRIGGER trg_award_profile_points
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_profile_completion_points();

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
