-- Member screens: requests, preferences, notifications, and capacity-safe bookings.
create table if not exists public.membership_renewal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete set null,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.member_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  payment_method text not null default 'GCash' check (payment_method in ('GCash','Cash')),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.membership_renewal_requests enable row level security;
alter table public.member_preferences enable row level security;
alter table public.member_notifications enable row level security;

drop policy if exists "Members read own renewal requests" on public.membership_renewal_requests;
create policy "Members read own renewal requests" on public.membership_renewal_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Members request renewal" on public.membership_renewal_requests;
create policy "Members request renewal" on public.membership_renewal_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
drop policy if exists "Admins manage renewal requests" on public.membership_renewal_requests;
create policy "Admins manage renewal requests" on public.membership_renewal_requests for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Members manage own preferences" on public.member_preferences;
create policy "Members manage own preferences" on public.member_preferences for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Members read own notifications" on public.member_notifications;
create policy "Members read own notifications" on public.member_notifications for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Members mark own notifications read" on public.member_notifications;
create policy "Members mark own notifications read" on public.member_notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Admins manage notifications" on public.member_notifications;
create policy "Admins manage notifications" on public.member_notifications for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant select, insert on public.membership_renewal_requests to authenticated;
grant select, insert, update on public.member_preferences to authenticated;
grant select, update on public.member_notifications to authenticated;
grant insert, update, delete on public.membership_renewal_requests, public.member_notifications to authenticated;

-- Return aggregate availability only; this avoids exposing other members' booking rows.
drop view if exists public.class_booking_counts;
create or replace function public.get_class_booking_counts(p_class_ids uuid[])
returns table(class_id uuid, booked_count integer)
language sql stable security definer set search_path = '' as $$
  select b.class_id, count(*)::integer
  from public.class_bookings b
  join public.gym_classes c on c.id = b.class_id
  where b.class_id = any(p_class_ids) and c.is_active and b.status in ('pending','approved')
  group by b.class_id;
$$;
revoke all on function public.get_class_booking_counts(uuid[]) from public, anon;
grant execute on function public.get_class_booking_counts(uuid[]) to authenticated;

-- Serialize booking submissions per class to prevent capacity overbooking.
create or replace function public.book_class(p_class_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_capacity integer;
  v_booking_id uuid;
  v_starts_at timestamptz;
  v_is_active boolean;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select capacity, starts_at, is_active into v_capacity, v_starts_at, v_is_active
  from public.gym_classes where id = p_class_id for update;
  if not found or not v_is_active then raise exception 'Class is unavailable'; end if;
  if v_starts_at <= now() then raise exception 'Class has already started'; end if;
  if exists (select 1 from public.class_bookings where class_id = p_class_id and user_id = v_user_id and status <> 'cancelled') then
    raise exception 'You already have a booking for this class';
  end if;
  if (select count(*) from public.class_bookings where class_id = p_class_id and status in ('pending','approved')) >= v_capacity then
    raise exception 'This class is full';
  end if;
  update public.class_bookings set status = 'pending', created_at = now()
    where class_id = p_class_id and user_id = v_user_id and status = 'cancelled' returning id into v_booking_id;
  if v_booking_id is null then
    insert into public.class_bookings(class_id,user_id,status) values (p_class_id,v_user_id,'pending') returning id into v_booking_id;
  end if;
  return v_booking_id;
end;
$$;
revoke all on function public.book_class(uuid) from public, anon;
grant execute on function public.book_class(uuid) to authenticated;
revoke insert on public.class_bookings from authenticated;
