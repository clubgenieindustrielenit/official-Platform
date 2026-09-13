-- ==============================================================================
-- MIGRATION: ENSURE CREATED_AT AND REGISTERED_AT EXIST ON EVENT_REGISTRATIONS
-- ==============================================================================

-- 1. Ensure created_at exists on public.event_registrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'event_registrations' 
      AND column_name = 'created_at'
  ) THEN
    -- If registered_at exists, copy its value or use now()
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'event_registrations' 
        AND column_name = 'registered_at'
    ) THEN
      ALTER TABLE public.event_registrations ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
      UPDATE public.event_registrations SET created_at = registered_at WHERE created_at IS NULL;
      ALTER TABLE public.event_registrations ALTER COLUMN created_at SET DEFAULT now();
    ELSE
      ALTER TABLE public.event_registrations ADD COLUMN created_at TIMESTAMPTZ DEFAULT now() NOT NULL;
    END IF;
  END IF;
END $$;

-- 2. Ensure registered_at exists as well for backwards compatibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'event_registrations' 
      AND column_name = 'registered_at'
  ) THEN
    ALTER TABLE public.event_registrations ADD COLUMN registered_at TIMESTAMPTZ DEFAULT now();
    UPDATE public.event_registrations SET registered_at = created_at WHERE registered_at IS NULL;
  END IF;
END $$;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
