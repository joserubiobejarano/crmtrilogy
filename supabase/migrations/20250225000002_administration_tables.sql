-- Administration: app_users (allowed emails), cities, program_types.
-- Drop events program_type check so new codes from program_types are allowed.

-- app_users: who is allowed to access the app (allow-list)
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

alter table public.app_users enable row level security;

-- Read: allow authenticated to read (for admin check and UI list)
create policy "Authenticated can read app_users"
  on public.app_users
  for select
  to authenticated
  using (true);

-- Insert: allow when table is empty (bootstrap) or when current user is already in app_users
create policy "App users can insert app_users"
  on public.app_users
  for insert
  to authenticated
  with check (
    (select count(*) from public.app_users) = 0
    or exists (
      select 1 from public.app_users au
      where lower(trim(au.email)) = lower(trim((auth.jwt() ->> 'email')))
    )
  );

-- Update: not used; no update policy needed.

-- Delete: only users already in app_users can delete (e.g. remove another user)
create policy "App users can delete app_users"
  on public.app_users
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.app_users au
      where lower(trim(au.email)) = lower(trim((auth.jwt() ->> 'email')))
    )
  );

-- cities: lookup for event city
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.cities enable row level security;

create policy "Authenticated users can manage cities"
  on public.cities
  for all
  to authenticated
  using (true)
  with check (true);

insert into public.cities (name) values ('Miami'), ('Atlanta')
on conflict (name) do nothing;

-- program_types: lookup for event program_type (Entrenamientos)
create table if not exists public.program_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  created_at timestamptz default now()
);

alter table public.program_types enable row level security;

create policy "Authenticated users can manage program_types"
  on public.program_types
  for all
  to authenticated
  using (true)
  with check (true);

insert into public.program_types (code, label) values
  ('PT', 'Poder Total'),
  ('LT', 'Libertad Total'),
  ('TL', 'TL')
on conflict (code) do nothing;

-- Allow any program_type in events (drop CHECK so we can add new codes via program_types)
alter table public.events drop constraint if exists events_program_type_check;
