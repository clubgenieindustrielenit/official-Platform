-- ==============================================================================
-- MIGRATION: ADD 'autre' VALUE TO activity_type ENUM
-- ==============================================================================

ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'autre';

NOTIFY pgrst, 'reload schema';
