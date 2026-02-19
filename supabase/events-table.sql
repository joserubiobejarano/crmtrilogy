-- Run this in the Supabase SQL Editor to create the events table.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  program_type text not null,
  code text not null,
  city text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  active boolean not null default false,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

-- Policy: allow authenticated users to select, insert, and update.
create policy "Authenticated users can manage events"
  on public.events
  for all
  to authenticated
  using (true)
  with check (true);
