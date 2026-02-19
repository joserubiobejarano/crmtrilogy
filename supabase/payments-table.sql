-- Run this in the Supabase SQL Editor after enrollments table exists.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  method text,
  amount numeric,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Authenticated users can manage payments"
  on public.payments
  for all
  to authenticated
  using (true)
  with check (true);

create index if not exists payments_enrollment_id_idx on public.payments (enrollment_id);
