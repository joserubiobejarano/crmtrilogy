-- Form submissions: source-of-truth for participant self-service.
-- Run after events, people, enrollments exist.

create type public.form_submission_source as enum ('form', 'ocr_draft');
create type public.form_submission_status as enum ('pending', 'processed', 'duplicate', 'rejected');

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  enrollment_id uuid references public.enrollments (id) on delete set null,
  person_id uuid references public.people (id) on delete set null,
  first_name text,
  last_name text,
  email text not null,
  phone text,
  angel_name text,
  source public.form_submission_source not null default 'form',
  status public.form_submission_status not null default 'pending',
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.form_submissions enable row level security;

create policy "Authenticated users can manage form_submissions"
  on public.form_submissions for all to authenticated using (true) with check (true);

-- Allow anon to insert only (for public form); service role or anon with RLS bypass.
create policy "Allow anon insert form_submissions"
  on public.form_submissions for insert to anon with check (true);

create index if not exists form_submissions_event_id_idx on public.form_submissions (event_id);
create index if not exists form_submissions_status_idx on public.form_submissions (status);
