create table if not exists public.login_email_challenges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0 check (attempts >= 0 and attempts <= 5),
  sent_at timestamptz not null default now()
);

alter table public.login_email_challenges enable row level security;
revoke all on table public.login_email_challenges from public, anon, authenticated;
grant select, insert, update, delete on table public.login_email_challenges to service_role;

create or replace function public.record_login_email_code_attempt(p_user_id uuid, p_code_hash text)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts smallint;
begin
  update public.login_email_challenges
  set attempts = attempts + 1
  where user_id = p_user_id and code_hash = p_code_hash and attempts < 5
  returning attempts into v_attempts;

  if v_attempts >= 5 then
    delete from public.login_email_challenges
    where user_id = p_user_id and code_hash = p_code_hash;
  end if;

  return v_attempts;
end;
$$;

create or replace function public.consume_login_email_code(p_user_id uuid, p_code_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consumed uuid;
begin
  delete from public.login_email_challenges
  where user_id = p_user_id
    and code_hash = p_code_hash
    and expires_at > now()
    and attempts < 5
  returning user_id into v_consumed;

  return v_consumed is not null;
end;
$$;

revoke all on function public.record_login_email_code_attempt(uuid, text) from public, anon, authenticated;
revoke all on function public.consume_login_email_code(uuid, text) from public, anon, authenticated;
grant execute on function public.record_login_email_code_attempt(uuid, text) to service_role;
grant execute on function public.consume_login_email_code(uuid, text) to service_role;
