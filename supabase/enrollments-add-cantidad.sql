-- Add cantidad (quantity) column to enrollments.
-- Run in Supabase SQL Editor after enrollments table exists.

alter table public.enrollments
  add column if not exists cantidad integer default null;
