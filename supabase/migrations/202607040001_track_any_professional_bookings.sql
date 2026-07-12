-- Preserve whether the customer deliberately selected a named therapist.
-- Existing rows predate this distinction and therefore remain locked to their
-- currently assigned therapist.
alter table public.bookings
  add column is_any_professional boolean not null default false;

-- Keep the public RPC signature stable. The existing implementation remains
-- the authoritative allocator; this wrapper records the customer's choice
-- after that allocator has atomically created the booking.
alter function public.create_booking(
  text, text, text, uuid, uuid, timestamptz, uuid, text
) rename to create_booking_internal;

revoke all on function public.create_booking_internal(
  text, text, text, uuid, uuid, timestamptz, uuid, text
) from public, anon, authenticated;

create function public.create_booking(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_location_id uuid,
  p_service_id uuid,
  p_start_at timestamptz,
  p_therapist_id uuid default null,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_result jsonb;
  v_booking_id uuid;
  v_is_any_professional boolean := p_therapist_id is null;
begin
  v_result := public.create_booking_internal(
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_location_id,
    p_service_id,
    p_start_at,
    p_therapist_id,
    p_notes
  );

  v_booking_id := (v_result ->> 'bookingId')::uuid;
  update public.bookings
  set is_any_professional = v_is_any_professional
  where id = v_booking_id;

  return v_result || jsonb_build_object(
    'isAnyProfessional', v_is_any_professional
  );
end;
$$;

revoke all on function public.create_booking(
  text, text, text, uuid, uuid, timestamptz, uuid, text
) from public;
grant execute on function public.create_booking(
  text, text, text, uuid, uuid, timestamptz, uuid, text
) to anon, authenticated;

-- Wrap the existing admin mutation without changing its signature. The inner
-- function retains all roster, time-range and overlap validation.
alter function public.admin_update_booking_appointment(
  uuid, uuid, uuid, timestamptz, timestamptz, public.booking_calendar_status
) rename to admin_update_booking_appointment_internal;

revoke all on function public.admin_update_booking_appointment_internal(
  uuid, uuid, uuid, timestamptz, timestamptz, public.booking_calendar_status
) from public, anon, authenticated;

create function public.admin_update_booking_appointment(
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

  if not v_booking.is_any_professional
     and p_therapist_id is distinct from v_booking.therapist_id then
    raise exception using
      errcode = '22023',
      message = 'This customer selected a specific therapist, so the therapist cannot be changed.';
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
