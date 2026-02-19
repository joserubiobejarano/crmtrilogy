-- Enrollment transfers: record seat moved from one person to another.
-- Run after enrollments exists.

create table if not exists public.enrollment_transfers (
  id uuid primary key default gen_random_uuid(),
  from_enrollment_id uuid references public.enrollments (id) on delete set null,
  to_enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  notes text,
  transferred_at timestamptz not null default now(),
  transferred_by uuid references auth.users (id) on delete set null
);

alter table public.enrollment_transfers enable row level security;

create policy "Authenticated users can manage enrollment_transfers"
  on public.enrollment_transfers for all to authenticated using (true) with check (true);

create index if not exists enrollment_transfers_event_id_idx on public.enrollment_transfers (event_id);
create index if not exists enrollment_transfers_from_idx on public.enrollment_transfers (from_enrollment_id);
create index if not exists enrollment_transfers_to_idx on public.enrollment_transfers (to_enrollment_id);
