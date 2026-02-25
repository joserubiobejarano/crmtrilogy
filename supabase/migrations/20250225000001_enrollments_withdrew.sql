-- Add withdrew (Retiró) to enrollments.
alter table public.enrollments
  add column if not exists withdrew boolean not null default false;
