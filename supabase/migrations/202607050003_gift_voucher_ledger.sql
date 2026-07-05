create unique index gift_voucher_sales_number_unique_idx
  on public.gift_voucher_sales (voucher_number);

create table public.gift_voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  gift_voucher_sale_id uuid not null references public.gift_voucher_sales(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  used_date date not null default current_date,
  booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now()
);

create index gift_voucher_redemptions_sale_idx on public.gift_voucher_redemptions (gift_voucher_sale_id, used_date);
alter table public.gift_voucher_redemptions enable row level security;

create policy "Admins manage gift voucher redemptions"
on public.gift_voucher_redemptions for all
to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

grant select, insert, delete on public.gift_voucher_redemptions to authenticated;
notify pgrst, 'reload schema';
