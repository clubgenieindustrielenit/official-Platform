-- ============================================================
-- Migration: Extended profile fields + avatars storage bucket
-- Adds optional personal information fields to profiles table
-- ============================================================

-- 1. Add new optional columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- 2. Create avatars storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for avatars bucket
DROP POLICY IF EXISTS "Public Read Access avatars" ON storage.objects;
CREATE POLICY "Public Read Access avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated Upload avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner Update avatars" ON storage.objects;
CREATE POLICY "Owner Update avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owner Delete avatars" ON storage.objects;
CREATE POLICY "Owner Delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
