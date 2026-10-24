-- Daily passes receive a one-day entry QR only after approval and payment.
alter table public.daily_pass_requests
  add column if not exists payment_status text not null default 'pending',
  add column if not exists access_token uuid,
  add column if not exists checked_in_at timestamptz;

alter table public.daily_pass_requests
  drop constraint if exists daily_pass_requests_payment_status_check;
alter table public.daily_pass_requests
  add constraint daily_pass_requests_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'refunded'));

create unique index if not exists daily_pass_requests_access_token_uidx
  on public.daily_pass_requests(access_token) where access_token is not null;

alter table public.payments
  add column if not exists daily_pass_request_id uuid
  references public.daily_pass_requests(id) on delete set null;

create unique index if not exists payments_daily_pass_request_uidx
  on public.payments(daily_pass_request_id) where daily_pass_request_id is not null;

-- Keep payment status and the entry token synchronized when an administrator
-- records cash/GCash payment in the Payments screen.
create or replace function public.sync_daily_pass_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.daily_pass_request_id is not null then
    update public.daily_pass_requests as request
    set payment_status = new.status,
        access_token = case
          when new.status = 'paid'
            and request.status = 'approved'::public.request_status
            and request.checked_in_at is null
            then coalesce(request.access_token, gen_random_uuid())
          else null
        end
    where request.id = new.daily_pass_request_id;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_sync_daily_pass on public.payments;
create trigger payments_sync_daily_pass
  after insert or update of status, daily_pass_request_id on public.payments
  for each row execute procedure public.sync_daily_pass_payment();

-- Link approved legacy passes to their existing payment rows when possible.
with ranked_passes as (
  select id, user_id, visit_on, amount, payment_method,
         row_number() over (partition by user_id, visit_on, amount, payment_method order by created_at, id) as row_num
  from public.daily_pass_requests
  where status = 'approved'::public.request_status
), ranked_pass_payments as (
  select id, user_id, amount, payment_method, description,
         row_number() over (partition by user_id, description, amount, payment_method order by created_at, id) as row_num
  from public.payments
  where daily_pass_request_id is null
    and membership_plan_request_id is null
    and description like 'Daily pass · visit %'
)
update public.payments as payment
set daily_pass_request_id = pass.id
from ranked_pass_payments as ranked_payment
join ranked_passes as pass
  on ranked_payment.user_id = pass.user_id
 and ranked_payment.amount = pass.amount
 and ranked_payment.payment_method = pass.payment_method
 and ranked_payment.description = 'Daily pass · visit ' || pass.visit_on::text
 and ranked_payment.row_num = pass.row_num
where payment.id = ranked_payment.id;

create or replace function public.admin_review_daily_pass_request(
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
  v_visit_on date;
  v_amount numeric(10,2);
  v_method text;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('approved'::public.request_status, 'rejected'::public.request_status) then
    raise exception 'Request decision must be approved or rejected';
  end if;

  select user_id, visit_on, amount, payment_method
  into v_user_id, v_visit_on, v_amount, v_method
  from public.daily_pass_requests
  where id = p_request_id and status = 'pending'::public.request_status
  for update;
  if not found then raise exception 'Pending daily pass request not found'; end if;

  update public.daily_pass_requests
  set status = p_status,
      access_token = case when p_status = 'approved'::public.request_status
        and payment_status = 'paid' and checked_in_at is null
        then coalesce(access_token, gen_random_uuid()) else null end
  where id = p_request_id;

  if p_status = 'approved'::public.request_status then
    insert into public.payments(user_id, description, amount, payment_method, status, daily_pass_request_id)
    values (v_user_id, 'Daily pass · visit ' || v_visit_on::text, v_amount, v_method, 'pending', p_request_id)
    on conflict (daily_pass_request_id) where daily_pass_request_id is not null do nothing;
  end if;

  insert into public.member_notifications(user_id, title, body)
  values (
    v_user_id,
    'Daily pass ' || p_status::text,
    case when p_status = 'approved'::public.request_status
      then format('Your pass for %s was approved. Gym staff will issue your entry QR after recording payment.', v_visit_on)
      else 'Your daily pass request was declined. Contact gym staff if you have questions.' end
  );
end;
$$;

revoke all on function public.admin_review_daily_pass_request(uuid, public.request_status) from public, anon;
grant execute on function public.admin_review_daily_pass_request(uuid, public.request_status) to authenticated;

create or replace function public.check_in_daily_pass(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_visit_on date;
  v_checked_in_at timestamptz;
  v_member_name text;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_token is null or p_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'This is not a valid StayFit daily pass QR.';
  end if;

  update public.daily_pass_requests as request
  set checked_in_at = now(), access_token = null
  where request.access_token::text = lower(p_token)
    and request.status = 'approved'::public.request_status
    and request.payment_status = 'paid'
    and request.visit_on = (now() at time zone 'Asia/Manila')::date
    and request.checked_in_at is null
  returning request.user_id, request.visit_on, request.checked_in_at
  into v_user_id, v_visit_on, v_checked_in_at;
  if not found then
    raise exception 'Pass is invalid, unpaid, not approved, not for today, or has already been used.';
  end if;

  select full_name into v_member_name from public.profiles where id = v_user_id;
  insert into public.attendance(user_id, recorded_by) values (v_user_id, auth.uid());

  return jsonb_build_object(
    'member_name', coalesce(v_member_name, 'Member'),
    'visit_on', v_visit_on,
    'checked_in_at', v_checked_in_at
  );
end;
$$;

revoke all on function public.check_in_daily_pass(text) from public, anon;
grant execute on function public.check_in_daily_pass(text) to authenticated;
