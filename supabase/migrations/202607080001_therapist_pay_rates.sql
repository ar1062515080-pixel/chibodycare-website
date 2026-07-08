alter table public.therapists
  add column if not exists pay_rate_cents_per_hour integer not null default 0
  check (pay_rate_cents_per_hour >= 0);

grant update (pay_rate_cents_per_hour) on public.therapists to authenticated;
