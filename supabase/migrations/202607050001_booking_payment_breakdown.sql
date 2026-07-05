alter table public.bookings
  add column card_amount_cents integer not null default 0 check (card_amount_cents >= 0),
  add column insurance_amount_cents integer not null default 0 check (insurance_amount_cents >= 0),
  add column cash_amount_cents integer not null default 0 check (cash_amount_cents >= 0),
  add column voucher_amount_cents integer not null default 0 check (voucher_amount_cents >= 0),
  add column waived_amount_cents integer not null default 0 check (waived_amount_cents >= 0);

create table public.daily_store_records (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  record_date date not null,
  opening_cash_cents integer not null default 0 check (opening_cash_cents >= 0),
  promotion_cents integer not null default 0 check (promotion_cents >= 0),
  other_income_cents integer not null default 0 check (other_income_cents >= 0),
  cash_expense_cents integer not null default 0 check (cash_expense_cents >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, record_date)
);

create table public.gift_voucher_sales (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  sale_date date not null,
  voucher_number text not null,
  face_value_cents integer not null check (face_value_cents > 0),
  card_amount_cents integer not null default 0 check (card_amount_cents >= 0),
  hicaps_amount_cents integer not null default 0 check (hicaps_amount_cents >= 0),
  cash_amount_cents integer not null default 0 check (cash_amount_cents >= 0),
  voucher_amount_cents integer not null default 0 check (voucher_amount_cents >= 0),
  waived_amount_cents integer not null default 0 check (waived_amount_cents >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (location_id, voucher_number)
);

create index daily_store_records_lookup_idx
  on public.daily_store_records (location_id, record_date);
create index gift_voucher_sales_lookup_idx
  on public.gift_voucher_sales (location_id, sale_date);

alter table public.daily_store_records enable row level security;
alter table public.gift_voucher_sales enable row level security;

create policy "Admins manage daily store records"
on public.daily_store_records for all
to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

create policy "Admins manage gift voucher sales"
on public.gift_voucher_sales for all
to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

grant select on public.bookings, public.daily_store_records, public.gift_voucher_sales to authenticated;
grant update (card_amount_cents, insurance_amount_cents, cash_amount_cents, voucher_amount_cents, waived_amount_cents) on public.bookings to authenticated;
grant insert, update on public.daily_store_records to authenticated;
grant insert, delete on public.gift_voucher_sales to authenticated;

notify pgrst, 'reload schema';
