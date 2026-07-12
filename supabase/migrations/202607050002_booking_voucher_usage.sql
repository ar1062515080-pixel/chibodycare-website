alter table public.bookings
  add column voucher_number text not null default '';

grant update (voucher_number) on public.bookings to authenticated;

notify pgrst, 'reload schema';
