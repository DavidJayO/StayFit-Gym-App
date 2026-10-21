-- PostgREST upsert with onConflict="membership_plan_request_id" requires
-- a non-partial unique index that can be inferred from that column alone.
drop index if exists public.payments_membership_plan_request_unique_idx;

create unique index payments_membership_plan_request_unique_idx
  on public.payments (membership_plan_request_id);
