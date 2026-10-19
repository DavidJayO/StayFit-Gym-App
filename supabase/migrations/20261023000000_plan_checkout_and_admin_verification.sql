-- Member plan checkout details and a single admin action that verifies payment
-- and activates the requested membership atomically.
alter table public.membership_plan_requests
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists payment_status text not null default 'not_submitted'
    check (payment_status in ('not_submitted', 'submitted', 'verified', 'rejected')),
  add column if not exists payment_submitted_at timestamptz,
  add column if not exists payment_verified_at timestamptz;

alter table public.payments
  add column if not exists membership_plan_request_id uuid
    references public.membership_plan_requests(id) on delete set null;
create unique index if not exists payments_membership_plan_request_unique_idx
  on public.payments(membership_plan_request_id)
  where membership_plan_request_id is not null;

create or replace function public.submit_membership_plan_payment(
  p_request_id uuid,
  p_payment_method text,
  p_payment_reference text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan_name text;
  v_amount numeric(10,2);
  v_status public.request_status;
  v_payment_status text;
  v_reference text := nullif(btrim(p_payment_reference), '');
begin
  if v_user_id is null then raise exception 'Sign in is required'; end if;
  if p_payment_method not in ('GCash', 'Cash') then raise exception 'Choose GCash or Cash'; end if;
  if p_payment_method = 'GCash' and (v_reference is null or length(v_reference) < 4) then
    raise exception 'Enter the GCash transaction reference';
  end if;

  select plan_name, amount, status, payment_status
    into v_plan_name, v_amount, v_status, v_payment_status
  from public.membership_plan_requests
  where id = p_request_id and user_id = v_user_id
  for update;
  if not found then raise exception 'Membership plan request not found'; end if;
  if v_status <> 'pending'::public.request_status then raise exception 'This plan request is no longer pending'; end if;
  if v_payment_status <> 'not_submitted' then raise exception 'Payment details have already been submitted'; end if;

  update public.membership_plan_requests
  set payment_method = p_payment_method,
      payment_reference = case when p_payment_method = 'GCash' then v_reference else null end,
      payment_status = 'submitted',
      payment_submitted_at = now()
  where id = p_request_id;

  insert into public.payments(user_id, description, amount, payment_method, status, membership_plan_request_id)
  values (v_user_id, v_plan_name || ' membership', v_amount, p_payment_method, 'pending', p_request_id);
end;
$$;

revoke all on function public.submit_membership_plan_payment(uuid, text, text) from public, anon;
grant execute on function public.submit_membership_plan_payment(uuid, text, text) to authenticated;

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
  v_amount numeric(10,2);
  v_payment_status text;
  v_admin_id uuid := auth.uid();
  v_start date := current_date;
  v_end date := (current_date + interval '1 month' - interval '1 day')::date;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('approved'::public.request_status, 'rejected'::public.request_status) then
    raise exception 'Request decision must be approved or rejected';
  end if;

  select user_id, plan_name, amount, payment_status
    into v_user_id, v_plan_name, v_amount, v_payment_status
  from public.membership_plan_requests
  where id = p_request_id and status = 'pending'
  for update;
  if not found then raise exception 'Pending membership plan request not found'; end if;
  if p_status = 'approved'::public.request_status and v_payment_status <> 'submitted' then
    raise exception 'The member must submit payment details before approval';
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
      then format('Your %s payment was verified. Your membership is active from %s through %s.', v_plan_name, v_start, v_end)
      else format('Your %s plan/payment request was declined. Contact gym staff if you have questions.', v_plan_name)
    end
  );
end;
$$;

revoke all on function public.admin_review_plan_request(uuid, public.request_status) from public, anon;
grant execute on function public.admin_review_plan_request(uuid, public.request_status) to authenticated;
