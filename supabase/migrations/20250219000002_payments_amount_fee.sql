-- Ensure payments has both amount (per-method amount) and fee_amount (fee) for spreadsheet-style UI.
alter table public.payments add column if not exists amount numeric;
alter table public.payments add column if not exists fee_amount numeric;
