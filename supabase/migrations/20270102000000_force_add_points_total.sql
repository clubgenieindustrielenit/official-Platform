-- ==============================================================================
-- MIGRATION: FORCE ADD POINTS_TOTAL AND FIX PROFILE TRIGGER
-- ==============================================================================

-- 1. Explicitly ensure points_total exists on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points_total INTEGER DEFAULT 0;

-- 2. Update trigger to safely check points_total existence using dynamic SQL/guards
CREATE OR REPLACE FUNCTION public.award_profile_completion_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pts_to_add INTEGER := 0;
  v_awarded BOOLEAN;
BEGIN
  -- 1. Photo de profil (avatar_url) -> 5 pts
  IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url <> '' AND (OLD.avatar_url IS NULL OR OLD.avatar_url = '') THEN
    SELECT EXISTS(SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : Photo de profil') INTO v_awarded;
    IF NOT v_awarded THEN
      INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : Photo de profil');
      v_pts_to_add := v_pts_to_add + 5;
    END IF;
  END IF;

  -- 2. CV (cv_url) -> 10 pts
  IF NEW.cv_url IS NOT NULL AND NEW.cv_url <> '' AND (OLD.cv_url IS NULL OR OLD.cv_url = '') THEN
    SELECT EXISTS(SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : CV ajouté') INTO v_awarded;
    IF NOT v_awarded THEN
      INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 10, 'Profil complété : CV ajouté');
      v_pts_to_add := v_pts_to_add + 10;
    END IF;
  END IF;

  -- 3. Lien LinkedIn (linkedin_url) -> 5 pts
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url <> '' AND (OLD.linkedin_url IS NULL OR OLD.linkedin_url = '') THEN
    SELECT EXISTS(SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : LinkedIn ajouté') INTO v_awarded;
    IF NOT v_awarded THEN
      INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : LinkedIn ajouté');
      v_pts_to_add := v_pts_to_add + 5;
    END IF;
  END IF;

  -- 4. Section prépa (prepa_section) -> 5 pts
  IF NEW.prepa_section IS NOT NULL AND NEW.prepa_section <> '' AND (OLD.prepa_section IS NULL OR OLD.prepa_section = '') THEN
    SELECT EXISTS(SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : Section prépa renseignée') INTO v_awarded;
    IF NOT v_awarded THEN
      INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : Section prépa renseignée');
      v_pts_to_add := v_pts_to_add + 5;
    END IF;
  END IF;

  -- 5. Établissement de prépa (prepa_etablissement) -> 5 pts
  IF NEW.prepa_etablissement IS NOT NULL AND NEW.prepa_etablissement <> '' AND (OLD.prepa_etablissement IS NULL OR OLD.prepa_etablissement = '') THEN
    SELECT EXISTS(SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : Établissement prépa renseigné') INTO v_awarded;
    IF NOT v_awarded THEN
      INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : Établissement prépa renseigné');
      v_pts_to_add := v_pts_to_add + 5;
    END IF;
  END IF;

  -- 6. Rang au concours (rang_concours) -> 5 pts
  IF NEW.rang_concours IS NOT NULL AND OLD.rang_concours IS NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : Rang concours renseigné') INTO v_awarded;
    IF NOT v_awarded THEN
      INSERT INTO public.points_log (user_id, amount, reason) VALUES (NEW.id, 5, 'Profil complété : Rang concours renseigné');
      v_pts_to_add := v_pts_to_add + 5;
    END IF;
  END IF;

  -- Update points_total safely
  IF v_pts_to_add > 0 THEN
    NEW.points_total := COALESCE(NEW.points_total, 0) + v_pts_to_add;
  END IF;

  -- Enregistrement de la date de complétion
  IF NEW.phone IS NOT NULL AND NEW.phone <> ''
     AND NEW.classe IS NOT NULL AND NEW.classe <> ''
     AND NEW.statut_membre IS NOT NULL AND NEW.statut_membre <> ''
     AND NEW.profile_completed_at IS NULL THEN
    NEW.profile_completed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
