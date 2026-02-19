-- Add columns to enrollments for form source, transfers, and reschedule.
-- Run after form_submissions and enrollments exist.

alter table public.enrollments
  add column if not exists source_form_submission_id uuid references public.form_submissions (id) on delete set null;

alter table public.enrollments
  add column if not exists replaced_by_enrollment_id uuid references public.enrollments (id) on delete set null;

alter table public.enrollments
  add column if not exists rescheduled_from_enrollment_id uuid references public.enrollments (id) on delete set null;

alter table public.enrollments
  add column if not exists rescheduled_to_enrollment_id uuid references public.enrollments (id) on delete set null;

create index if not exists enrollments_source_form_submission_id_idx on public.enrollments (source_form_submission_id);
create index if not exists enrollments_replaced_by_idx on public.enrollments (replaced_by_enrollment_id);
create index if not exists enrollments_rescheduled_from_idx on public.enrollments (rescheduled_from_enrollment_id);
create index if not exists enrollments_rescheduled_to_idx on public.enrollments (rescheduled_to_enrollment_id);
