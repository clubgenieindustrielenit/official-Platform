-- ==============================================================================
-- MIGRATION: FIX NOTIFICATIONS RLS POLICIES FOR ADMIN & SELF MANAGEMENT
-- ==============================================================================

-- Drop existing restricted policies
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin_all" ON public.notifications;

-- 1. SELECT: Users can view their own notifications; Admin/Bureau can view all
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role)::text = ANY (ARRAY['admin'::text, 'membre_bureau'::text, 'bureau'::text])
    ))
  );

-- 2. INSERT: Users can create notifications for themselves; Admin/Bureau can create notifications for any user
CREATE POLICY "notifications_insert_policy" ON public.notifications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role)::text = ANY (ARRAY['admin'::text, 'membre_bureau'::text, 'bureau'::text])
    ))
  );

-- 3. UPDATE: Users can update their own notifications (e.g. mark read); Admin/Bureau can update all
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role)::text = ANY (ARRAY['admin'::text, 'membre_bureau'::text, 'bureau'::text])
    ))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role)::text = ANY (ARRAY['admin'::text, 'membre_bureau'::text, 'bureau'::text])
    ))
  );

-- 4. DELETE: Users can delete their own notifications; Admin/Bureau can delete any notification
CREATE POLICY "notifications_delete_policy" ON public.notifications
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role)::text = ANY (ARRAY['admin'::text, 'membre_bureau'::text, 'bureau'::text])
    ))
  );

NOTIFY pgrst, 'reload schema';
