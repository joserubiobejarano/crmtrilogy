-- Run this in the Supabase SQL Editor to create the people table.

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  phone text,
  email text not null,
  created_at timestamptz default now(),
  unique (email)
);

alter table public.people enable row level security;

create policy "Authenticated users can manage people"
  on public.people
  for all
  to authenticated
  using (true)
  with check (true);
