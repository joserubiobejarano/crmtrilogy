-- Enable RLS on event_reports (security review: align with events table).
-- When multi-tenancy is added, scope policies by tenant/event ownership.
alter table public.event_reports enable row level security;

create policy "Authenticated users can manage event_reports"
  on public.event_reports
  for all
  to authenticated
  using (true)
  with check (true);
