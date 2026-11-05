-- Store the member's planned arrival time with the selected daily-pass date.
-- Existing requests receive a neutral morning time so they remain readable.
alter table public.daily_pass_requests
  add column if not exists visit_time time without time zone;

update public.daily_pass_requests
set visit_time = time '09:00'
where visit_time is null;

alter table public.daily_pass_requests
  alter column visit_time set default time '09:00',
  alter column visit_time set not null;
