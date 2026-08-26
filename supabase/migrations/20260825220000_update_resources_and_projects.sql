-- Migration: Update resources and projects tables
-- 1. Add academic_year column to resources
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '1ère année GI';

-- 2. Add google_form_url to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS google_form_url TEXT;
