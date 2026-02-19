-- Universal audit log for accountability and human-readable timeline.
-- Run in Supabase SQL Editor.

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now(),
  context jsonb default '{}',
  changes jsonb default '[]'
);

alter table public.audit_log enable row level security;

create policy "Authenticated users can insert audit_log"
  on public.audit_log for insert to authenticated with check (true);

create policy "Authenticated users can select audit_log"
  on public.audit_log for select to authenticated using (true);

create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index if not exists audit_log_changed_at_idx on public.audit_log (changed_at desc);
create index if not exists audit_log_context_event_id_idx on public.audit_log ((context->>'event_id')) where context ? 'event_id';
