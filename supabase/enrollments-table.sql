-- Run this in the Supabase SQL Editor after events and people tables exist.

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  status text not null default 'pending_contract',
  attended boolean not null default false,
  details_sent boolean not null default false,
  confirmed boolean not null default false,
  contract_signed boolean not null default false,
  cca_signed boolean not null default false,
  admin_notes text,
  angel_name text,
  doc_salud boolean default false,
  normas_tl boolean default false,
  reglas_tl boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (event_id, person_id)
);

alter table public.enrollments enable row level security;

create policy "Authenticated users can manage enrollments"
  on public.enrollments
  for all
  to authenticated
  using (true)
  with check (true);

create index if not exists enrollments_event_id_idx on public.enrollments (event_id);
create index if not exists enrollments_person_id_idx on public.enrollments (person_id);
