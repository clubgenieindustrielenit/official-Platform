-- ==============================================================================
-- MIGRATION: EVENT REGISTRATIONS, WAITLIST PROMOTION & ATTENDANCE POINTS
-- ==============================================================================

-- 1. Table event_registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  queue_position INTEGER,
  attended BOOLEAN DEFAULT false,
  points_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(activity_id, user_id)
);

-- RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_registrations_select_all" ON public.event_registrations;
CREATE POLICY "event_registrations_select_all" ON public.event_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "event_registrations_insert_own" ON public.event_registrations;
CREATE POLICY "event_registrations_insert_own" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "event_registrations_update_own_or_admin" ON public.event_registrations;
CREATE POLICY "event_registrations_update_own_or_admin" ON public.event_registrations FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "event_registrations_delete_own_or_admin" ON public.event_registrations;
CREATE POLICY "event_registrations_delete_own_or_admin" ON public.event_registrations FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- 2. register_to_activity function
DROP FUNCTION IF EXISTS public.register_to_activity(uuid);
CREATE OR REPLACE FUNCTION public.register_to_activity(p_activity_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_capacity INTEGER;
  v_current_count INTEGER;
  v_status TEXT;
  v_queue_pos INTEGER := NULL;
  v_reg_id UUID;
  v_activity_title TEXT;
  v_activity_entreprise TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  SELECT title, entreprise, capacity INTO v_activity_title, v_activity_entreprise, v_capacity
  FROM public.activities
  WHERE id = p_activity_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activité non trouvée';
  END IF;

  -- Count confirmed registrations
  SELECT count(*) INTO v_current_count
  FROM public.event_registrations
  WHERE activity_id = p_activity_id AND status = 'confirmed';

  IF v_capacity IS NOT NULL AND v_current_count >= v_capacity THEN
    v_status := 'waitlisted';
    SELECT COALESCE(MAX(queue_position), 0) + 1 INTO v_queue_pos
    FROM public.event_registrations
    WHERE activity_id = p_activity_id AND status = 'waitlisted';
  ELSE
    v_status := 'confirmed';
  END IF;

  INSERT INTO public.event_registrations (activity_id, user_id, status, queue_position)
  VALUES (p_activity_id, v_user_id, v_status, v_queue_pos)
  ON CONFLICT (activity_id, user_id)
  DO UPDATE SET status = EXCLUDED.status, queue_position = EXCLUDED.queue_position, created_at = now()
  RETURNING id INTO v_reg_id;

  -- Notification
  IF v_status = 'confirmed' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
      v_user_id,
      'système',
      'Inscription confirmée 🎉',
      'Votre inscription à la visite chez ' || COALESCE(v_activity_entreprise, v_activity_title) || ' est bien confirmée !',
      '/membre/visites/' || p_activity_id::text,
      false
    );
  ELSE
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
      v_user_id,
      'système',
      'Liste d''attente ⏳',
      'Vous êtes en liste d''attente (position #' || v_queue_pos || ') pour la visite ' || COALESCE(v_activity_entreprise, v_activity_title) || '.',
      '/membre/visites/' || p_activity_id::text,
      false
    );
  END IF;

  RETURN jsonb_build_object('id', v_reg_id, 'status', v_status, 'queue_position', v_queue_pos);
END;
$$;

-- 3. cancel_registration function with auto promotion
DROP FUNCTION IF EXISTS public.cancel_registration(uuid);
CREATE OR REPLACE FUNCTION public.cancel_registration(p_registration_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
  v_user_id UUID;
  v_status TEXT;
  v_next_user RECORD;
  v_activity_title TEXT;
  v_activity_entreprise TEXT;
BEGIN
  SELECT activity_id, user_id, status INTO v_activity_id, v_user_id, v_status
  FROM public.event_registrations
  WHERE id = p_registration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inscription non trouvée';
  END IF;

  DELETE FROM public.event_registrations WHERE id = p_registration_id;

  -- If a confirmed spot was freed, promote the first waitlisted member
  IF v_status = 'confirmed' THEN
    SELECT id, user_id INTO v_next_user
    FROM public.event_registrations
    WHERE activity_id = v_activity_id AND status = 'waitlisted'
    ORDER BY queue_position ASC, created_at ASC
    LIMIT 1;

    IF v_next_user.id IS NOT NULL THEN
      UPDATE public.event_registrations
      SET status = 'confirmed', queue_position = NULL
      WHERE id = v_next_user.id;

      SELECT title, entreprise INTO v_activity_title, v_activity_entreprise
      FROM public.activities WHERE id = v_activity_id;

      INSERT INTO public.notifications (user_id, type, title, message, link, read)
      VALUES (
        v_next_user.user_id,
        'système',
        'Place confirmée ! 🎉',
        'Une place s''est libérée pour la visite chez ' || COALESCE(v_activity_entreprise, v_activity_title) || '. Votre inscription est désormais confirmée !',
        '/membre/visites/' || v_activity_id::text,
        false
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Attendance Points Trigger
CREATE OR REPLACE FUNCTION public.award_attendance_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
  v_entreprise TEXT;
BEGIN
  IF NEW.attended = true AND (OLD.attended IS NULL OR OLD.attended = false) AND NEW.points_awarded = false THEN
    SELECT title, entreprise INTO v_title, v_entreprise FROM public.activities WHERE id = NEW.activity_id;

    INSERT INTO public.points_log (user_id, amount, reason)
    VALUES (NEW.user_id, 5, 'Présence visite : ' || COALESCE(v_entreprise, v_title));

    UPDATE public.profiles
    SET points_total = COALESCE(points_total, 0) + 5
    WHERE id = NEW.user_id;

    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
      NEW.user_id,
      'points',
      'Points de présence crédités 🏭',
      'Vous avez reçu +5 points pour votre présence à la visite ' || COALESCE(v_entreprise, v_title) || '.',
      '/membre/profil',
      false
    );

    NEW.points_awarded := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_attendance_points ON public.event_registrations;
CREATE TRIGGER trg_award_attendance_points
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.award_attendance_points();
