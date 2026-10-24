-- Add PayPal hosted checkout to daily passes while preserving old GCash rows
-- for historical requests. New member requests use PayPal or Cash.
alter table public.daily_pass_requests
  add column if not exists paypal_invoice_id text,
  add column if not exists paypal_invoice_url text;

alter table public.daily_pass_requests
  drop constraint if exists daily_pass_requests_payment_method_check;
alter table public.daily_pass_requests
  add constraint daily_pass_requests_payment_method_check
  check (payment_method in ('PayPal', 'Cash', 'GCash'));

alter table public.daily_pass_requests
  drop constraint if exists daily_pass_requests_payment_status_check;
alter table public.daily_pass_requests
  add constraint daily_pass_requests_payment_status_check
  check (payment_status in ('pending', 'submitted', 'paid', 'failed', 'refunded'));

-- Keep PayPal pass verification atomic: only an administrator can confirm a
-- request after the Edge Function has checked the invoice with PayPal.
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
  if p_status = 'approved'::public.request_status and v_method = 'PayPal' then
    raise exception 'Verify the PayPal invoice before approving this daily pass';
  end if;

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
      then format('Your pass for %s was approved. Staff will confirm your payment before issuing the entry QR.', v_visit_on)
      else 'Your daily pass request was declined. Contact gym staff if you have questions.' end
  );
end;
$$;

revoke all on function public.admin_review_daily_pass_request(uuid, public.request_status) from public, anon;
grant execute on function public.admin_review_daily_pass_request(uuid, public.request_status) to authenticated;

create or replace function public.admin_confirm_daily_pass_paypal(
  p_request_id uuid,
  p_invoice_id text
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
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;

  select user_id, visit_on, amount
    into v_user_id, v_visit_on, v_amount
  from public.daily_pass_requests
  where id = p_request_id
    and status = 'pending'::public.request_status
    and payment_method = 'PayPal'
    and payment_status = 'submitted'
    and paypal_invoice_id = p_invoice_id
  for update;
  if not found then raise exception 'Pending PayPal daily pass request or matching invoice not found'; end if;

  update public.daily_pass_requests
  set status = 'approved'::public.request_status,
      payment_status = 'paid'
  where id = p_request_id;

  insert into public.payments(user_id, description, amount, payment_method, status, paid_at, daily_pass_request_id)
  values (v_user_id, 'Daily pass · visit ' || v_visit_on::text, v_amount, 'PayPal', 'paid', now(), p_request_id)
  on conflict (daily_pass_request_id) where daily_pass_request_id is not null
  do update set status = 'paid', paid_at = now(), payment_method = 'PayPal';

  insert into public.member_notifications(user_id, title, body)
  values (v_user_id, 'Daily pass approved', format('PayPal payment was verified. Your daily entry pass is ready for %s.', v_visit_on));
end;
$$;

revoke all on function public.admin_confirm_daily_pass_paypal(uuid, text) from public, anon;
grant execute on function public.admin_confirm_daily_pass_paypal(uuid, text) to authenticated;
