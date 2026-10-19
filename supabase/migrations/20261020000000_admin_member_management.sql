-- Allow administrators to manage member contact details without granting the
-- client permission to change roles or other profile fields.
alter table public.profiles add column if not exists email text not null default '';

update public.profiles p
set email = coalesce(u.email, '')
from auth.users u
where p.id = u.id and p.email = '';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.raw_user_meta_data ->> 'phone', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.sync_auth_user_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_auth_user_email_to_profile on auth.users;
create trigger sync_auth_user_email_to_profile after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute procedure public.sync_auth_user_email();

drop policy if exists "Admins update member contact details" on public.profiles;
create policy "Admins update member contact details" on public.profiles
  for update to authenticated
  using ((select public.is_admin()) and role = 'member')
  with check ((select public.is_admin()) and role = 'member');

grant update (full_name, phone) on public.profiles to authenticated;

-- Apply request decisions as one transaction and keep the member app in sync.
create or replace function public.admin_review_member_request(
  p_kind text,
  p_request_id uuid,
  p_status public.request_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_admin_id uuid := auth.uid();
  v_days integer;
  v_visit_on date;
  v_amount numeric(10,2);
  v_method text;
  v_membership_id uuid;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('approved'::public.request_status, 'rejected'::public.request_status) then
    raise exception 'Request decision must be approved or rejected';
  end if;

  if p_kind = 'freeze' then
    select user_id, duration_days into v_user_id, v_days
      from public.freeze_requests where id = p_request_id and status = 'pending' for update;
    if not found then raise exception 'Pending freeze request not found'; end if;
    if p_status = 'approved'::public.request_status then
      select id into v_membership_id from public.memberships
        where user_id = v_user_id and status = 'active'
          and starts_on <= current_date and ends_on >= current_date
        order by ends_on desc limit 1 for update;
      if not found then raise exception 'Member has no active membership to freeze'; end if;
      update public.memberships set status = 'frozen', ends_on = ends_on + v_days where id = v_membership_id;
    end if;
    update public.freeze_requests set status = p_status, reviewed_at = now(), reviewed_by = v_admin_id where id = p_request_id;
    insert into public.member_notifications(user_id, title, body)
      values (v_user_id, 'Membership freeze ' || p_status::text,
        case when p_status = 'approved'::public.request_status
          then format('Your membership is now frozen. Its expiration date was extended by %s days.', v_days)
          else 'Your membership freeze request was declined. Contact gym staff if you have questions.' end);
  elsif p_kind = 'daily_pass' then
    select user_id, visit_on, amount, payment_method into v_user_id, v_visit_on, v_amount, v_method
      from public.daily_pass_requests where id = p_request_id and status = 'pending' for update;
    if not found then raise exception 'Pending daily pass request not found'; end if;
    update public.daily_pass_requests set status = p_status where id = p_request_id;
    if p_status = 'approved'::public.request_status then
      insert into public.payments(user_id, description, amount, payment_method, status)
        values (v_user_id, 'Daily pass · visit ' || v_visit_on::text, v_amount, v_method, 'pending');
    end if;
    insert into public.member_notifications(user_id, title, body)
      values (v_user_id, 'Daily pass ' || p_status::text,
        case when p_status = 'approved'::public.request_status
          then format('Your pass request for %s was approved. Payment is awaiting gym staff confirmation.', v_visit_on)
          else 'Your daily pass request was declined. Contact gym staff if you have questions.' end);
  elsif p_kind = 'renewal' then
    select user_id into v_user_id from public.membership_renewal_requests
      where id = p_request_id and status = 'pending' for update;
    if not found then raise exception 'Pending renewal request not found'; end if;
    update public.membership_renewal_requests set status = p_status where id = p_request_id;
    insert into public.member_notifications(user_id, title, body)
      values (v_user_id, 'Renewal request ' || p_status::text,
        case when p_status = 'approved'::public.request_status
          then 'Your renewal request was approved. Contact gym staff to complete payment and apply your renewal.'
          else 'Your renewal request was declined. Contact gym staff if you have questions.' end);
  else
    raise exception 'Unknown member request type';
  end if;
end;
$$;

revoke all on function public.admin_review_member_request(text, uuid, public.request_status) from public, anon;
grant execute on function public.admin_review_member_request(text, uuid, public.request_status) to authenticated;
