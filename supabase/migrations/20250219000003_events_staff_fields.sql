-- Add staff text fields to events (free text for names).
alter table public.events
  add column if not exists entrenadores text,
  add column if not exists capitan_mentores text,
  add column if not exists mentores text;
