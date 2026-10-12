-- StayFit gym backend. Run this migration in the Supabase SQL Editor.
create extension if not exists pgcrypto;
create type public.app_role as enum ('member', 'admin');
create type public.request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role public.app_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.raw_user_meta_data ->> 'phone', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- SECURITY DEFINER avoids recursive profiles RLS checks inside admin policies.
create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'::public.app_role);
$$;

create table public.memberships (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text not null, status text not null default 'active' check (status in ('active','expired','frozen','cancelled')),
  starts_on date not null, ends_on date not null, created_at timestamptz not null default now(), check (ends_on >= starts_on)
);
create table public.gym_classes (
  id uuid primary key default gen_random_uuid(), name text not null, category text not null, trainer_name text not null,
  starts_at timestamptz not null, duration_minutes integer not null check (duration_minutes > 0),
  capacity integer not null check (capacity > 0), is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.class_bookings (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.gym_classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, status public.request_status not null default 'pending',
  created_at timestamptz not null default now(), unique (class_id, user_id)
);
create table public.attendance (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(), checked_out_at timestamptz,
  recorded_by uuid references public.profiles(id) on delete set null,
  check (checked_out_at is null or checked_out_at >= checked_in_at)
);
create table public.freeze_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  duration_days integer not null check (duration_days in (7,14,30)), reason text not null,
  status public.request_status not null default 'pending', created_at timestamptz not null default now(),
  reviewed_at timestamptz, reviewed_by uuid references public.profiles(id) on delete set null
);
create table public.daily_pass_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  visit_on date not null, amount numeric(10,2) not null default 250.00 check (amount = 250.00),
  payment_method text not null check (payment_method in ('GCash','Cash')),
  status public.request_status not null default 'pending', created_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null, amount numeric(10,2) not null check (amount >= 0), payment_method text not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  paid_at timestamptz, created_at timestamptz not null default now()
);

create index memberships_user_idx on public.memberships(user_id, ends_on desc);
create index gym_classes_starts_idx on public.gym_classes(starts_at) where is_active;
create index class_bookings_user_idx on public.class_bookings(user_id, created_at desc);
create index attendance_user_idx on public.attendance(user_id, checked_in_at desc);
create index freeze_requests_user_idx on public.freeze_requests(user_id, created_at desc);
create index daily_pass_requests_user_idx on public.daily_pass_requests(user_id, created_at desc);
create index payments_user_idx on public.payments(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.gym_classes enable row level security;
alter table public.class_bookings enable row level security;
alter table public.attendance enable row level security;
alter table public.freeze_requests enable row level security;
alter table public.daily_pass_requests enable row level security;
alter table public.payments enable row level security;

create policy "Profiles owner and admin read" on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));
-- No client profile update policy: role and contact data require trusted admin tooling.
create policy "Membership owner and admin read" on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins manage memberships" on public.memberships for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Authenticated users read active classes" on public.gym_classes for select to authenticated
  using (is_active or (select public.is_admin()));
create policy "Admins manage classes" on public.gym_classes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Booking owner and admin read" on public.class_bookings for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Members create bookings" on public.class_bookings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Members cancel pending bookings" on public.class_bookings for update to authenticated
  using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status = 'cancelled');
create policy "Admins manage bookings" on public.class_bookings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Attendance owner and admin read" on public.attendance for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins manage attendance" on public.attendance for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Freeze owner and admin read" on public.freeze_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Members submit freeze requests" on public.freeze_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
create policy "Admins review freeze requests" on public.freeze_requests for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Pass request owner and admin read" on public.daily_pass_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Members submit pass requests" on public.daily_pass_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
create policy "Admins manage pass requests" on public.daily_pass_requests for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Payment owner and admin read" on public.payments for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins manage payments" on public.payments for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant usage on schema public to authenticated;
revoke all on public.profiles, public.memberships, public.gym_classes, public.class_bookings,
  public.attendance, public.freeze_requests, public.daily_pass_requests, public.payments
  from anon, authenticated;
grant select on public.profiles, public.memberships, public.gym_classes, public.class_bookings,
  public.attendance, public.freeze_requests, public.daily_pass_requests, public.payments to authenticated;
grant insert on public.class_bookings, public.freeze_requests, public.daily_pass_requests to authenticated;
grant update (status) on public.class_bookings to authenticated;
grant insert, update, delete on public.memberships, public.gym_classes, public.attendance,
  public.freeze_requests, public.daily_pass_requests, public.payments to authenticated;
grant delete on public.class_bookings to authenticated;
grant execute on function public.is_admin() to authenticated;

-- After registering an admin account, promote it from SQL Editor:
-- update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
