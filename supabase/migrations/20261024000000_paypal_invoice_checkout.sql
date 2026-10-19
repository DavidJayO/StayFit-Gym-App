-- Upgrade the plan checkout to PayPal's hosted invoice + QR-code flow.
alter table public.membership_plan_requests
  add column if not exists paypal_invoice_id text,
  add column if not exists paypal_invoice_url text;

alter table public.membership_plan_requests
  drop constraint if exists membership_plan_requests_payment_status_check;
alter table public.membership_plan_requests
  add constraint membership_plan_requests_payment_status_check
  check (payment_status in ('not_submitted', 'submitted', 'paid', 'verified', 'rejected'));

-- Payment status can only become paid after the authenticated admin edge function
-- has checked the associated invoice with PayPal. Approval then records the payment
-- and creates the active membership in one database transaction.
create or replace function public.admin_review_plan_request(
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
  v_plan_name text;
  v_payment_status text;
  v_invoice_id text;
  v_admin_id uuid := auth.uid();
  v_start date := current_date;
  v_end date := (current_date + interval '1 month' - interval '1 day')::date;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('approved'::public.request_status, 'rejected'::public.request_status) then
    raise exception 'Request decision must be approved or rejected';
  end if;

  select user_id, plan_name, payment_status, paypal_invoice_id
    into v_user_id, v_plan_name, v_payment_status, v_invoice_id
  from public.membership_plan_requests
  where id = p_request_id and status = 'pending'
  for update;
  if not found then raise exception 'Pending membership plan request not found'; end if;
  if p_status = 'approved'::public.request_status
     and (v_payment_status <> 'paid' or v_invoice_id is null) then
    raise exception 'Verify the PayPal invoice payment before activating this membership';
  end if;
  if p_status = 'approved'::public.request_status and exists (
    select 1 from public.memberships
    where user_id = v_user_id and status = 'active'
      and starts_on <= current_date and ends_on >= current_date
  ) then
    raise exception 'This member already has an active membership';
  end if;

  update public.membership_plan_requests
  set status = p_status,
      reviewed_at = now(),
      reviewed_by = v_admin_id,
      payment_status = case when p_status = 'approved'::public.request_status then 'verified' else 'rejected' end,
      payment_verified_at = case when p_status = 'approved'::public.request_status then now() else null end
  where id = p_request_id;

  update public.payments
  set status = case when p_status = 'approved'::public.request_status then 'paid' else 'failed' end,
      paid_at = case when p_status = 'approved'::public.request_status then now() else null end
  where membership_plan_request_id = p_request_id;

  if p_status = 'approved'::public.request_status then
    insert into public.memberships(user_id, plan_name, status, starts_on, ends_on)
    values (v_user_id, v_plan_name, 'active', v_start, v_end);
  end if;

  insert into public.member_notifications(user_id, title, body)
  values (
    v_user_id,
    case when p_status = 'approved'::public.request_status then 'Membership confirmed' else 'Plan request declined' end,
    case when p_status = 'approved'::public.request_status
      then format('PayPal confirmed your %s payment. Your membership is active from %s through %s.', v_plan_name, v_start, v_end)
      else format('Your %s plan request was declined. Contact gym staff if you have questions.', v_plan_name)
    end
  );
end;
$$;

revoke all on function public.admin_review_plan_request(uuid, public.request_status) from public, anon;
grant execute on function public.admin_review_plan_request(uuid, public.request_status) to authenticated;

-- This member RPC is superseded by the server-side PayPal invoice integration.
revoke all on function public.submit_membership_plan_payment(uuid, text, text) from public, anon, authenticated;
