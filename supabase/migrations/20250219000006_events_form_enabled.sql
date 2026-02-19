-- Optional: restrict public form to specific events. When true, /form/e/:id is allowed.
-- Default true preserves current behavior (all events have form enabled).
alter table public.events
  add column if not exists form_enabled boolean not null default true;

comment on column public.events.form_enabled is 'When true, the public participant form is available for this event at /form/e/:eventId';
