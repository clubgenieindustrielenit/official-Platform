-- ==============================================================================
-- MIGRATION: FIX PROFILE POINTS TRIGGER DEDUPLICATION AND CONCOURS YEAR MAPPING
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.award_profile_completion_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pts_delta INTEGER := 0;
  v_old_concours_year TEXT;
  v_new_concours_year TEXT;
BEGIN
  -- ───────────────────────────────────────────────────────────────────────────
  -- 1. Photo de profil (avatar_url) -> +/- 5 pts
  -- ───────────────────────────────────────────────────────────────────────────
  IF (NEW.avatar_url IS NOT NULL AND TRIM(NEW.avatar_url) <> '') 
     AND (OLD.avatar_url IS NULL OR TRIM(OLD.avatar_url) = '') THEN
    IF NOT EXISTS (SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : Photo de profil') THEN
      INSERT INTO public.points_log (user_id, amount, reason) 
      VALUES (NEW.id, 5, 'Profil complété : Photo de profil');
      v_pts_delta := v_pts_delta + 5;
    END IF;
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
    IF NOT EXISTS (SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : CV ajouté') THEN
      INSERT INTO public.points_log (user_id, amount, reason) 
      VALUES (NEW.id, 10, 'Profil complété : CV ajouté');
      v_pts_delta := v_pts_delta + 10;
    END IF;
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
    IF NOT EXISTS (SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : LinkedIn ajouté') THEN
      INSERT INTO public.points_log (user_id, amount, reason) 
      VALUES (NEW.id, 5, 'Profil complété : LinkedIn ajouté');
      v_pts_delta := v_pts_delta + 5;
    END IF;
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
    IF NOT EXISTS (SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : Section prépa renseignée') THEN
      INSERT INTO public.points_log (user_id, amount, reason) 
      VALUES (NEW.id, 5, 'Profil complété : Section prépa renseignée');
      v_pts_delta := v_pts_delta + 5;
    END IF;
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
    IF NOT EXISTS (SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : Établissement prépa renseigné') THEN
      INSERT INTO public.points_log (user_id, amount, reason) 
      VALUES (NEW.id, 5, 'Profil complété : Établissement prépa renseigné');
      v_pts_delta := v_pts_delta + 5;
    END IF;
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
    IF NOT EXISTS (SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : Rang concours renseigné') THEN
      INSERT INTO public.points_log (user_id, amount, reason) 
      VALUES (NEW.id, 5, 'Profil complété : Rang concours renseigné');
      v_pts_delta := v_pts_delta + 5;
    END IF;
  ELSIF NEW.rang_concours IS NULL AND OLD.rang_concours IS NOT NULL THEN
    INSERT INTO public.points_log (user_id, amount, reason) 
    VALUES (NEW.id, -5, 'Profil modifié : Rang concours supprimé');
    v_pts_delta := v_pts_delta - 5;
  END IF;

  -- ───────────────────────────────────────────────────────────────────────────
  -- 7. Année Concours (annee_concours / bio / training_availability) -> +/- 5 pts
  -- ───────────────────────────────────────────────────────────────────────────
  v_old_concours_year := COALESCE(NULLIF(TRIM(OLD.annee_concours), ''), NULLIF(TRIM(OLD.bio), ''), NULLIF(TRIM(OLD.training_availability), ''));
  v_new_concours_year := COALESCE(NULLIF(TRIM(NEW.annee_concours), ''), NULLIF(TRIM(NEW.bio), ''), NULLIF(TRIM(NEW.training_availability), ''));

  IF (v_new_concours_year IS NOT NULL) AND (v_old_concours_year IS NULL) THEN
    IF NOT EXISTS (SELECT 1 FROM public.points_log WHERE user_id = NEW.id AND reason = 'Profil complété : Année de concours renseignée') THEN
      INSERT INTO public.points_log (user_id, amount, reason) 
      VALUES (NEW.id, 5, 'Profil complété : Année de concours renseignée');
      v_pts_delta := v_pts_delta + 5;
    END IF;
  ELSIF (v_old_concours_year IS NOT NULL) AND (v_new_concours_year IS NULL) THEN
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

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
