-- Keep the membership tied to the specific approved plan request and payment.
alter table public.memberships
  add column if not exists membership_plan_request_id uuid
    references public.membership_plan_requests(id) on delete set null;
create unique index if not exists memberships_plan_request_unique_idx
  on public.memberships(membership_plan_request_id)
  where membership_plan_request_id is not null;

with possible_links as (
  select m.id as membership_id, r.id as request_id,
    count(*) over (partition by m.id) as requests_for_membership,
    count(*) over (partition by r.id) as memberships_for_request
  from public.memberships m
  join public.membership_plan_requests r
    on r.user_id = m.user_id and r.plan_name = m.plan_name
    and r.reviewed_at::date = m.starts_on
    and r.status = 'approved'::public.request_status and r.payment_status = 'verified'
  where m.membership_plan_request_id is null
)
update public.memberships m
  set membership_plan_request_id = possible.request_id
  from possible_links possible
  where m.id = possible.membership_id and possible.requests_for_membership = 1
    and possible.memberships_for_request = 1;

-- Record the request ID on any new membership confirmed by the existing PayPal flow.
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
    from public.membership_plan_requests where id = p_request_id and status = 'pending'
    for update;
  if not found then raise exception 'Pending membership plan request not found'; end if;
  if p_status = 'approved'::public.request_status and (v_payment_status <> 'paid' or v_invoice_id is null) then
    raise exception 'Verify the PayPal invoice payment before activating this membership';
  end if;
  if p_status = 'approved'::public.request_status and exists (
    select 1 from public.memberships where user_id = v_user_id and status = 'active'
      and starts_on <= current_date and ends_on >= current_date
  ) then raise exception 'This member already has an active membership'; end if;

  update public.membership_plan_requests
    set status = p_status, reviewed_at = now(), reviewed_by = v_admin_id,
        payment_status = case when p_status = 'approved'::public.request_status then 'verified' else 'rejected' end,
        payment_verified_at = case when p_status = 'approved'::public.request_status then now() else null end
    where id = p_request_id;
  update public.payments
    set status = case when p_status = 'approved'::public.request_status then 'paid' else 'failed' end,
        paid_at = case when p_status = 'approved'::public.request_status then now() else null end
    where membership_plan_request_id = p_request_id;

  if p_status = 'approved'::public.request_status then
    insert into public.memberships(user_id, plan_name, status, starts_on, ends_on, membership_plan_request_id)
      values (v_user_id, v_plan_name, 'active', v_start, v_end, p_request_id);
  end if;

  insert into public.member_notifications(user_id, title, body)
    values (v_user_id,
      case when p_status = 'approved'::public.request_status then 'Membership confirmed' else 'Plan request declined' end,
      case when p_status = 'approved'::public.request_status
        then format('PayPal confirmed your %s payment. Your membership is active from %s through %s.', v_plan_name, v_start, v_end)
        else format('Your %s plan request was declined. Contact gym staff if you have questions.', v_plan_name) end);
end;
$$;
revoke all on function public.admin_review_plan_request(uuid, public.request_status) from public, anon;
grant execute on function public.admin_review_plan_request(uuid, public.request_status) to authenticated;

create table if not exists public.membership_cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  reason text not null default '',
  status public.request_status not null default 'pending',
  refund_status text not null default 'not_requested'
    check (refund_status in ('not_requested', 'requested', 'issued')),
  refund_reference text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  refund_recorded_at timestamptz
);

create index if not exists membership_cancellation_requests_user_idx
  on public.membership_cancellation_requests(user_id, created_at desc);
create unique index if not exists membership_cancellation_one_pending_per_membership_idx
  on public.membership_cancellation_requests(membership_id) where status = 'pending';

alter table public.membership_cancellation_requests enable row level security;
revoke all on public.membership_cancellation_requests from public, anon;
grant select, insert on public.membership_cancellation_requests to authenticated;

create policy "Members and admins read cancellation requests"
  on public.membership_cancellation_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Members request membership cancellation"
  on public.membership_cancellation_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'::public.request_status
    and exists (
      select 1 from public.memberships m
      where m.id = membership_id and m.user_id = (select auth.uid())
        and m.status in ('active', 'frozen')
    )
    and (
      (refund_status = 'not_requested' and payment_id is null)
      or (refund_status = 'requested' and payment_id is not null and exists (
        select 1 from public.payments p
        where p.id = payment_id and p.user_id = (select auth.uid()) and p.status = 'paid'
          and p.membership_plan_request_id = (
            select m.membership_plan_request_id from public.memberships m
            where m.id = membership_id and m.user_id = (select auth.uid())
          )
      ))
    )
  );

create or replace function public.admin_review_membership_cancellation(
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
  v_membership_id uuid;
  v_refund_status text;
  v_admin_id uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('approved'::public.request_status, 'rejected'::public.request_status) then
    raise exception 'Request decision must be approved or rejected';
  end if;

  select user_id, membership_id, refund_status
    into v_user_id, v_membership_id, v_refund_status
    from public.membership_cancellation_requests
    where id = p_request_id and status = 'pending'
    for update;
  if not found then raise exception 'Pending cancellation request not found'; end if;

  if p_status = 'approved'::public.request_status then
    update public.memberships set status = 'cancelled'
      where id = v_membership_id and user_id = v_user_id and status in ('active', 'frozen');
    if not found then raise exception 'Membership is no longer active or frozen'; end if;
  end if;

  update public.membership_cancellation_requests
    set status = p_status, reviewed_at = now(), reviewed_by = v_admin_id,
        refund_status = case when p_status = 'rejected'::public.request_status then 'not_requested' else v_refund_status end
    where id = p_request_id;

  insert into public.member_notifications(user_id, title, body)
    values (
      v_user_id,
      case when p_status = 'approved'::public.request_status then 'Membership cancellation approved' else 'Cancellation request declined' end,
      case when p_status = 'approved'::public.request_status and v_refund_status = 'requested'
        then 'Your membership was cancelled. Your refund request is awaiting manual PayPal processing by the gym.'
        when p_status = 'approved'::public.request_status then 'Your membership cancellation was approved.'
        else 'Your membership cancellation request was declined. Contact gym staff if you have questions.' end
    );
end;
$$;

create or replace function public.admin_record_membership_refund(
  p_request_id uuid,
  p_refund_reference text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_payment_id uuid;
  v_admin_id uuid := auth.uid();
  v_reference text := nullif(btrim(p_refund_reference), '');
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if v_reference is null then raise exception 'Enter the PayPal refund ID or transaction reference'; end if;

  select user_id, payment_id into v_user_id, v_payment_id
    from public.membership_cancellation_requests
    where id = p_request_id and status = 'approved'::public.request_status
      and refund_status = 'requested'
    for update;
  if not found then raise exception 'Approved cancellation with a pending refund was not found'; end if;
  if v_payment_id is null then raise exception 'This request has no linked paid transaction'; end if;

  update public.payments set status = 'refunded'
    where id = v_payment_id and user_id = v_user_id and status = 'paid';
  if not found then raise exception 'Linked payment is not currently marked paid'; end if;

  update public.membership_cancellation_requests
    set refund_status = 'issued', refund_reference = v_reference,
        refund_recorded_at = now(), reviewed_by = v_admin_id
    where id = p_request_id;

  insert into public.member_notifications(user_id, title, body)
    values (v_user_id, 'Membership refund recorded', 'The gym recorded your PayPal refund. Reference: ' || v_reference);
end;
$$;

revoke all on function public.admin_review_membership_cancellation(uuid, public.request_status) from public, anon;
grant execute on function public.admin_review_membership_cancellation(uuid, public.request_status) to authenticated;
revoke all on function public.admin_record_membership_refund(uuid, text) from public, anon;
grant execute on function public.admin_record_membership_refund(uuid, text) to authenticated;
