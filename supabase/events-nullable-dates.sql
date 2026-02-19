-- Run this in the Supabase SQL Editor to allow NULL start_date/end_date and enforce program_type.
-- Required before the app can create events without dates.

ALTER TABLE public.events ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.events ALTER COLUMN end_date DROP NOT NULL;

-- Enforce program_type is exactly PT, LT, or TL (only add if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_program_type_check' AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events ADD CONSTRAINT events_program_type_check CHECK (program_type IN ('PT', 'LT', 'TL'));
  END IF;
END $$;
