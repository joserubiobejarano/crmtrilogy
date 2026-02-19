-- Add scheduled_deletion_at for soft delete with 7-day recovery window.
-- When set, the event will be permanently deleted after this timestamp.

alter table public.events
  add column if not exists scheduled_deletion_at timestamptz;
