-- Event closure reports: one row per event, stores only editable notes.
-- Report body is computed from event + enrollments when viewing.
create table if not exists public.event_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id)
);

create index if not exists event_reports_event_id_idx on public.event_reports(event_id);

comment on table public.event_reports is 'One report per event; notes are editable, report content is generated from event + enrollments';
