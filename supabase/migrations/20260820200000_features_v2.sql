-- ==============================================================================
-- MIGRATION: FEATURES V2 (PREINSCRIPTION, STATUT MEMBRE, VISITES, RESSOURCES, NOTIFICATIONS)
-- ==============================================================================

-- 1. Extension de la table profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS classe TEXT CHECK (classe IN ('1AGI1', '1AGI2', '1AGI3', '2AGI1', '2AGI2', '2AGI3', '3AGI')),
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS prepa_section TEXT CHECK (prepa_section IN ('MP', 'PC', 'PT')),
  ADD COLUMN IF NOT EXISTS prepa_etablissement TEXT,
  ADD COLUMN IF NOT EXISTS rang_concours INTEGER,
  ADD COLUMN IF NOT EXISTS cv_url TEXT,
  ADD COLUMN IF NOT EXISTS statut_membre TEXT CHECK (statut_membre IN ('senior', 'actif', 'alumni')),
  ADD COLUMN IF NOT EXISTS statut_membre_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- 2. Extension de la table activities pour le module visites
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS entreprise TEXT,
  ADD COLUMN IF NOT EXISTS google_form_url TEXT;

-- 3. Extension de la table resources
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS drive_url TEXT;

-- 4. Création de la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('points', 'message', 'système')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Activation RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE read = false;

-- Politiques RLS pour notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS sur points_log : Interdire l'INSERT direct côté client non autorisé
DROP POLICY IF EXISTS "points_log_deny_client_insert" ON public.points_log;
CREATE POLICY "points_log_deny_client_insert" ON public.points_log
  FOR INSERT
  WITH CHECK (false);

-- Trigger idempotent pour l'attribution des points lors de la complétion du profil
DROP FUNCTION IF EXISTS public.award_profile_completion_points();
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

  -- Mise à jour du total de points si des points ont été attribués
  IF v_pts_to_add > 0 THEN
    NEW.points_total := COALESCE(NEW.points_total, 0) + v_pts_to_add;
  END IF;

  -- Enregistrement de la date de complétion si les champs obligatoires sont renseignés
  IF NEW.phone IS NOT NULL AND NEW.phone <> ''
     AND NEW.classe IS NOT NULL AND NEW.classe <> ''
     AND NEW.statut_membre IS NOT NULL AND NEW.statut_membre <> ''
     AND NEW.profile_completed_at IS NULL THEN
    NEW.profile_completed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_profile_completion_points ON public.profiles;
CREATE TRIGGER trg_award_profile_completion_points
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_profile_completion_points();
