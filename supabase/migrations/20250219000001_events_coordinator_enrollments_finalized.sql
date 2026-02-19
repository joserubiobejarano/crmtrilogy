-- Add coordinator to events (free text).
alter table public.events
  add column if not exists coordinator text;

-- Add finalized to enrollments (checkbox for "Finalizó").
alter table public.enrollments
  add column if not exists finalized boolean not null default false;
