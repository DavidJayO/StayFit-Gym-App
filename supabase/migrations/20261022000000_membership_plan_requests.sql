-- Let members request first-time plans; gym staff confirm payment and activate them.
create table if not exists public.membership_plan_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text not null,
  amount numeric(10,2) not null,
  billing_period text not null default 'month' check (billing_period = 'month'),
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  constraint membership_plan_requests_known_plan check (
    (plan_name = 'Premium Monthly' and amount = 1999.00) or
    (plan_name = 'Standard Monthly' and amount = 1299.00)
  )
);

create index if not exists membership_plan_requests_user_idx
  on public.membership_plan_requests(user_id, created_at desc);
create unique index if not exists membership_plan_requests_one_pending_per_user_idx
  on public.membership_plan_requests(user_id) where status = 'pending';

alter table public.membership_plan_requests enable row level security;
drop policy if exists "Members and admins read plan requests" on public.membership_plan_requests;
create policy "Members and admins read plan requests" on public.membership_plan_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Members request a plan" on public.membership_plan_requests;
create policy "Members request a plan" on public.membership_plan_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

revoke all on public.membership_plan_requests from anon, authenticated;
grant select, insert on public.membership_plan_requests to authenticated;

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
  v_admin_id uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('approved'::public.request_status, 'rejected'::public.request_status) then
    raise exception 'Request decision must be approved or rejected';
  end if;

  select user_id, plan_name into v_user_id, v_plan_name
  from public.membership_plan_requests
  where id = p_request_id and status = 'pending'
  for update;
  if not found then raise exception 'Pending membership plan request not found'; end if;

  update public.membership_plan_requests
  set status = p_status, reviewed_at = now(), reviewed_by = v_admin_id
  where id = p_request_id;

  insert into public.member_notifications(user_id, title, body)
  values (
    v_user_id,
    case when p_status = 'approved'::public.request_status then 'Plan request approved' else 'Plan request declined' end,
    case when p_status = 'approved'::public.request_status
      then format('Your %s request was approved. Please contact or visit the gym to confirm payment. Staff will activate your membership after payment is recorded.', v_plan_name)
      else format('Your %s request was declined. Contact gym staff if you have questions.', v_plan_name)
    end
  );
end;
$$;

revoke all on function public.admin_review_plan_request(uuid, public.request_status) from public, anon;
grant execute on function public.admin_review_plan_request(uuid, public.request_status) to authenticated;

-- Align daily pass pricing with the member plan catalog while preserving existing historic amounts.
alter table public.daily_pass_requests alter column amount set default 150.00;
alter table public.daily_pass_requests drop constraint if exists daily_pass_requests_amount_check;
alter table public.daily_pass_requests drop constraint if exists daily_pass_requests_amount_positive;
alter table public.daily_pass_requests add constraint daily_pass_requests_amount_positive check (amount > 0);
