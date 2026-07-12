-- Repair production databases that were created before the later admin
-- booking calendar work. The app already checks admin_users before rendering
-- admin pages; these policies make the database grants match that behaviour.

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.can_manage_location(uuid) to authenticated;

grant select, insert on public.bookings to authenticated;
grant update (
  status,
  notes,
  therapist_id,
  daily_roster_id,
  start_at,
  end_at,
  calendar_status,
  card_amount_cents,
  insurance_amount_cents,
  cash_amount_cents,
  voucher_amount_cents,
  waived_amount_cents,
  voucher_number
) on public.bookings to authenticated;

drop policy if exists "Admins read bookings" on public.bookings;
create policy "Admins read bookings"
on public.bookings for select
to authenticated
using (public.can_manage_location(location_id));

drop policy if exists "Admins insert bookings" on public.bookings;
create policy "Admins insert bookings"
on public.bookings for insert
to authenticated
with check (public.can_manage_location(location_id));

drop policy if exists "Admins update bookings" on public.bookings;
create policy "Admins update bookings"
on public.bookings for update
to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

notify pgrst, 'reload schema';
