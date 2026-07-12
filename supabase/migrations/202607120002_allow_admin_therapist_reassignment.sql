create or replace function public.admin_update_booking_appointment(
  p_booking_id uuid,
  p_therapist_id uuid,
  p_daily_roster_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_calendar_status public.booking_calendar_status
)
returns table (
  booking_id uuid,
  therapist_id uuid,
  daily_roster_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  status public.booking_status,
  calendar_status public.booking_calendar_status
)
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select *
  into v_booking
  from public.bookings b
  where b.id = p_booking_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Booking not found.';
  end if;

  if not public.can_manage_location(v_booking.location_id) then
    raise exception using errcode = '42501', message = 'You are not authorised to manage this booking.';
  end if;

  return query
  select *
  from public.admin_update_booking_appointment_internal(
    p_booking_id,
    p_therapist_id,
    p_daily_roster_id,
    p_start_at,
    p_end_at,
    p_calendar_status
  );
end;
$$;

revoke all on function public.admin_update_booking_appointment(
  uuid, uuid, uuid, timestamptz, timestamptz, public.booking_calendar_status
) from public;
grant execute on function public.admin_update_booking_appointment(
  uuid, uuid, uuid, timestamptz, timestamptz, public.booking_calendar_status
) to authenticated;

notify pgrst, 'reload schema';
