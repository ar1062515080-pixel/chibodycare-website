-- Calendar-specific state used by the admin appointment calendar. The
-- existing booking_status remains the source of truth for booking workflow.
create type public.booking_calendar_status as enum ('unpaid', 'paid', 'no_show');

alter table public.bookings
  add column calendar_status public.booking_calendar_status not null default 'unpaid';

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
  v_roster public.daily_rosters%rowtype;
  v_status public.booking_status;
  v_local_start timestamp;
  v_local_end timestamp;
begin
  select *
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Booking not found.';
  end if;

  if not public.can_manage_location(v_booking.location_id) then
    raise exception using errcode = '42501', message = 'You are not authorised to manage this booking.';
  end if;

  if p_end_at <= p_start_at then
    raise exception using errcode = '22023', message = 'The appointment end time must be after its start time.';
  end if;

  -- Start positions snap to the calendar's 15-minute grid. Durations are not
  -- required to be multiples of 15 because real services include 20-minute
  -- treatments; moving one must preserve that valid duration.
  if extract(epoch from (p_end_at - p_start_at)) < 900
     or mod(extract(epoch from p_start_at)::bigint, 900) <> 0 then
    raise exception using errcode = '22023', message = 'Appointment start times must use 15-minute increments and appointments must last at least 15 minutes.';
  end if;

  select dr.*
  into v_roster
  from public.daily_rosters dr
  join public.therapists t on t.id = dr.therapist_id and t.active
  where dr.id = p_daily_roster_id
    and dr.therapist_id = p_therapist_id
    and dr.location_id = v_booking.location_id
    and dr.active;

  if not found then
    raise exception using errcode = '22023', message = 'The selected therapist is not active on this store roster.';
  end if;

  if not exists (
    select 1
    from public.roster_services rs
    where rs.daily_roster_id = v_roster.id
      and rs.service_id = v_booking.service_id
  ) then
    raise exception using errcode = '22023', message = 'The selected therapist is not rostered for this service.';
  end if;

  v_local_start := p_start_at at time zone 'Australia/Adelaide';
  v_local_end := p_end_at at time zone 'Australia/Adelaide';

  if v_roster.date <> v_local_start::date
     or v_roster.date <> v_local_end::date
     or v_local_start::time < v_roster.start_time
     or v_local_end::time > v_roster.end_time then
    raise exception using errcode = '22023', message = 'The appointment must stay within the selected roster shift.';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.id <> p_booking_id
      and b.therapist_id = p_therapist_id
      and b.status in ('pending', 'confirmed')
      and tstzrange(b.start_at, b.end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  ) then
    raise exception using errcode = '23P01', message = 'This therapist already has an appointment during the selected time.';
  end if;

  v_status := case
    when p_calendar_status = 'no_show' then 'no_show'::public.booking_status
    when v_booking.status = 'no_show' then 'confirmed'::public.booking_status
    else v_booking.status
  end;

  return query
  update public.bookings b
  set therapist_id = p_therapist_id,
      daily_roster_id = p_daily_roster_id,
      start_at = p_start_at,
      end_at = p_end_at,
      status = v_status,
      calendar_status = p_calendar_status
  where b.id = p_booking_id
  returning b.id, b.therapist_id, b.daily_roster_id, b.start_at, b.end_at,
    b.status, b.calendar_status;
exception
  when exclusion_violation then
    raise exception using errcode = '23P01', message = 'This therapist already has an appointment during the selected time.';
end;
$$;

revoke all on function public.admin_update_booking_appointment(
  uuid, uuid, uuid, timestamptz, timestamptz, public.booking_calendar_status
) from public;
grant execute on function public.admin_update_booking_appointment(
  uuid, uuid, uuid, timestamptz, timestamptz, public.booking_calendar_status
) to authenticated;

-- Existing authenticated admin SELECT policies continue to scope rows by
-- location; make the newly added column available through that table grant.
grant select on public.bookings to authenticated;

notify pgrst, 'reload schema';
