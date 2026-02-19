-- Add city to people for profile-based search (city where they took the event).
alter table public.people
  add column if not exists city text;

-- Backfill: set each person's city from their most recent enrollment
-- (enrollment.city if set, else event.city).
update public.people p
set city = sub.city
from (
  select distinct on (e.person_id) e.person_id, coalesce(e.city, ev.city) as city
  from public.enrollments e
  join public.events ev on ev.id = e.event_id
  where ev.scheduled_deletion_at is null
  order by e.person_id, e.created_at desc
) sub
where p.id = sub.person_id;
