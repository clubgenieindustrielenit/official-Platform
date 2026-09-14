-- ==============================================================================
-- MIGRATION: ENSURE photo_urls ON activities AND RELOAD SCHEMA CACHE
-- ==============================================================================
-- Resolves "Could not find the 'photo_urls' column of 'activities' in the schema cache"
-- Supports multi-photo carousel on activities and social posts.
-- ==============================================================================

-- 1. Add photo_urls column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activities'
      AND column_name = 'photo_urls'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN photo_urls TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- 2. Backfill photo_urls with image_url if photo_urls is empty
UPDATE public.activities
SET photo_urls = ARRAY[image_url]
WHERE (photo_urls IS NULL OR cardinality(photo_urls) = 0)
  AND image_url IS NOT NULL
  AND image_url != '';

-- 3. Ensure storage bucket for activity images exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-images', 'activity-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies for activity-images bucket
DO $$
BEGIN
  -- Public select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read activity-images'
  ) THEN
    CREATE POLICY "Public read activity-images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'activity-images');
  END IF;

  -- Authenticated insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin/bureau upload activity-images'
  ) THEN
    CREATE POLICY "Admin/bureau upload activity-images"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'activity-images'
        AND auth.role() = 'authenticated'
      );
  END IF;

  -- Authenticated delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin/bureau delete activity-images'
  ) THEN
    CREATE POLICY "Admin/bureau delete activity-images"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'activity-images'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- 5. Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
