-- ==============================================================================
-- MIGRATION: Table des Feedbacks (Bugs & Suggestions)
-- Date: 2027-01-05
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'autre')) DEFAULT 'bug',
  description TEXT NOT NULL,
  page_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('nouveau', 'en_cours', 'resolu', 'archive')) DEFAULT 'nouveau',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation de Row Level Security
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 1. Tout utilisateur authentifié peut soumettre un feedback pour son propre compte
CREATE POLICY "Les membres peuvent créer des feedbacks"
  ON public.feedbacks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. L'auteur ou les membres admin / bureau peuvent consulter les feedbacks
CREATE POLICY "Consultation des feedbacks par auteur et staff"
  ON public.feedbacks
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'membre_bureau', 'bureau')
    )
  );

-- 3. Seuls les admins et membres du bureau peuvent modifier le statut ou supprimer
CREATE POLICY "Gestion des feedbacks par admin et bureau"
  ON public.feedbacks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'membre_bureau', 'bureau')
    )
  );

CREATE POLICY "Suppression des feedbacks par admin et bureau"
  ON public.feedbacks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'membre_bureau', 'bureau')
    )
  );

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON public.feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_type ON public.feedbacks(type);
