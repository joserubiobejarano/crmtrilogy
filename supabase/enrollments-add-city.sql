-- Run this in the Supabase SQL Editor.
-- Adds city column to enrollments for per-enrollment city override (defaults from event.city).

alter table public.enrollments add column if not exists city text;
