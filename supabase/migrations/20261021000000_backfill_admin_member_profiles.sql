-- Ensure every existing Auth user has a profile row for the admin directory.
-- Existing profile values and roles are preserved; newly created profiles default to member.
alter table public.profiles
  add column if not exists email text not null default '';

insert into public.profiles (id, email, full_name, phone)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'phone', '')
from auth.users u
on conflict (id) do update
set email = excluded.email,
    full_name = case
      when nullif(btrim(public.profiles.full_name), '') is null then excluded.full_name
      else public.profiles.full_name
    end,
    phone = case
      when nullif(btrim(public.profiles.phone), '') is null then excluded.phone
      else public.profiles.phone
    end;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_auth_user_email_to_profile on auth.users;
create trigger sync_auth_user_email_to_profile
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute procedure public.sync_auth_user_email();
