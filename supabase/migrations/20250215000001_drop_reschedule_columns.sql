-- Remove reschedule columns from enrollments (Reagendar feature deprecated).
-- Run only if no important reschedule data must be kept.

alter table public.enrollments drop column if exists rescheduled_to_enrollment_id;
alter table public.enrollments drop column if exists rescheduled_from_enrollment_id;
drop index if exists enrollments_rescheduled_to_idx;
drop index if exists enrollments_rescheduled_from_idx;
