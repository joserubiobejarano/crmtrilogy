-- Sync new Supabase Auth users into app_users so they appear in the Usuarios table.
-- Trigger runs with SECURITY DEFINER so it can insert into app_users regardless of RLS.

create or replace function public.sync_auth_user_to_app_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (email)
  values (lower(trim(new.email)))
  on conflict (email) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_sync_app_users
  after insert on auth.users
  for each row execute procedure public.sync_auth_user_to_app_users();

-- Optionally remove from app_users when Auth user is deleted
create or replace function public.remove_app_user_on_auth_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.app_users
  where lower(trim(email)) = lower(trim(old.email));
  return old;
end;
$$;

create trigger on_auth_user_deleted_remove_app_user
  after delete on auth.users
  for each row execute procedure public.remove_app_user_on_auth_delete();
