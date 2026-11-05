create table if not exists public.unfreeze_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  reason text not null default '',
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create index if not exists unfreeze_requests_user_idx
  on public.unfreeze_requests(user_id, created_at desc);
create unique index if not exists unfreeze_requests_one_pending_per_membership_idx
  on public.unfreeze_requests(membership_id) where status = 'pending';

alter table public.unfreeze_requests enable row level security;
revoke all on public.unfreeze_requests from public, anon;
grant select, insert on public.unfreeze_requests to authenticated;

create policy "Member and admin read unfreeze requests"
  on public.unfreeze_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Members request unfreeze for frozen memberships"
  on public.unfreeze_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.memberships m
      where m.id = membership_id
        and m.user_id = (select auth.uid())
        and m.status = 'frozen'
    )
  );

create or replace function public.admin_review_unfreeze_request(
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
  v_admin_id uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('approved'::public.request_status, 'rejected'::public.request_status) then
    raise exception 'Request decision must be approved or rejected';
  end if;

  select user_id, membership_id into v_user_id, v_membership_id
    from public.unfreeze_requests
    where id = p_request_id and status = 'pending'
    for update;
  if not found then raise exception 'Pending unfreeze request not found'; end if;

  if p_status = 'approved'::public.request_status then
    update public.memberships
      set status = case
        when starts_on <= current_date and ends_on >= current_date then 'active'
        else 'expired'
      end
      where id = v_membership_id and user_id = v_user_id and status = 'frozen';
    if not found then raise exception 'The member does not have a frozen membership'; end if;
  end if;

  update public.unfreeze_requests
    set status = p_status, reviewed_at = now(), reviewed_by = v_admin_id
    where id = p_request_id;

  insert into public.member_notifications(user_id, title, body)
    values (
      v_user_id,
      case when p_status = 'approved'::public.request_status then 'Membership unfreeze request approved' else 'Unfreeze request declined' end,
      case when p_status = 'approved'::public.request_status and exists (
        select 1 from public.memberships where id = v_membership_id and status = 'active'
      ) then 'Your membership is active again.'
        when p_status = 'approved'::public.request_status then 'Your unfreeze request was approved, but the membership has expired. Please contact the gym to renew it.'
        else 'Your membership unfreeze request was declined. Contact gym staff if you have questions.' end
    );
end;
$$;

revoke all on function public.admin_review_unfreeze_request(uuid, public.request_status) from public, anon;
grant execute on function public.admin_review_unfreeze_request(uuid, public.request_status) to authenticated;
