-- ==============================================================================
-- MIGRATION: CREATE CVS AND STORAGE BUCKETS WITH POLICIES
-- ==============================================================================

-- 1. Create storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('cvs', 'cvs', true),
  ('avatars', 'avatars', true),
  ('resources', 'resources', true),
  ('activity-images', 'activity-images', true),
  ('partner-logos', 'partner-logos', true),
  ('hero-carousel', 'hero-carousel', true),
  ('testimonials', 'testimonials', true),
  ('developers', 'developers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies for 'cvs' bucket
DROP POLICY IF EXISTS "Public Read cvs" ON storage.objects;
CREATE POLICY "Public Read cvs" ON storage.objects
  FOR SELECT USING (bucket_id = 'cvs');

DROP POLICY IF EXISTS "Authenticated Upload cvs" ON storage.objects;
CREATE POLICY "Authenticated Upload cvs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cvs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update cvs" ON storage.objects;
CREATE POLICY "Authenticated Update cvs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cvs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Delete cvs" ON storage.objects;
CREATE POLICY "Authenticated Delete cvs" ON storage.objects
  FOR DELETE USING (bucket_id = 'cvs' AND auth.role() = 'authenticated');

-- 3. Storage RLS Policies for 'avatars' bucket
DROP POLICY IF EXISTS "Public Read avatars" ON storage.objects;
CREATE POLICY "Public Read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated Upload avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update avatars" ON storage.objects;
CREATE POLICY "Authenticated Update avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Delete avatars" ON storage.objects;
CREATE POLICY "Authenticated Delete avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
