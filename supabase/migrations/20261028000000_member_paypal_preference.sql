-- Replace the saved GCash preference with PayPal, preserving cash as an option.
alter table public.member_preferences
  drop constraint if exists member_preferences_payment_method_check;

update public.member_preferences
set payment_method = 'PayPal'
where payment_method = 'GCash';

alter table public.member_preferences
  alter column payment_method set default 'PayPal';

alter table public.member_preferences
  add constraint member_preferences_payment_method_check
  check (payment_method in ('PayPal', 'Cash'));
