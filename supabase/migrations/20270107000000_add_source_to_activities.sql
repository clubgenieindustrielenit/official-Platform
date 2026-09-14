-- ==============================================================================
-- MIGRATION: ADD source COLUMN TO activities TABLE
-- ==============================================================================
-- This column separates "social posts" (Activités du Club feed, Instagram-like)
-- from "enrollment activities" (events, visites, formations with registration).
--
-- source = 'post'       → created via PostCreatorModal (admin/bureau social feed)
-- source = 'enrollment' → created via dedicated Événements/Visites/Formations panels
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activities'
      AND column_name = 'source'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN source TEXT NOT NULL DEFAULT 'enrollment';
  END IF;
END $$;

-- Back-fill: any existing activities that have NO enrollment type should be posts.
-- Rows without type or with category-only data are almost certainly social posts.
-- We use a heuristic: if type = 'event' AND category is one of the post categories,
-- it was probably created from PostCreatorModal.
-- Admins can manually fix edge cases via the admin panel.
UPDATE public.activities
SET source = 'post'
WHERE type = 'event'
  AND category IN ('Workshop', 'Hackathon', 'Conférence', 'Autre', 'Workshop', 'Conference');

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
