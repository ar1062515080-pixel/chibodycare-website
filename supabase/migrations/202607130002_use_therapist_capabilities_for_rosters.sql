-- Daily rosters only define who is working at a store and during which hours.
-- The services a therapist can perform are managed centrally in
-- therapist_services from the therapist management page.

create or replace function public.get_open_start_times(
  p_location_id uuid,
  p_date date,
  p_slot_interval_minutes integer default 30
)
returns table (slot_start timestamptz)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with therapist_services_with_duration as (
    select dr.id as roster_id, dr.therapist_id, dr.date, dr.start_time,
      dr.end_time, s.duration_minutes
    from public.daily_rosters dr
    join public.therapists t on t.id = dr.therapist_id and t.active
    join public.therapist_services ts on ts.therapist_id = dr.therapist_id
    join public.services s on s.id = ts.service_id and s.active
    join public.locations l on l.id = dr.location_id and l.active
    where dr.location_id = p_location_id and dr.date = p_date and dr.active
  ), candidates as (
    select tswd.therapist_id,
      gs as candidate_start,
      gs + make_interval(mins => tswd.duration_minutes) as candidate_end
    from therapist_services_with_duration tswd
    cross join lateral generate_series(
      (tswd.date + tswd.start_time) at time zone 'Australia/Adelaide',
      ((tswd.date + tswd.end_time) at time zone 'Australia/Adelaide')
        - make_interval(mins => tswd.duration_minutes),
      make_interval(mins => case when p_slot_interval_minutes in (15, 30) then p_slot_interval_minutes else 30 end)
    ) gs
  )
  select distinct c.candidate_start
  from candidates c
  where c.candidate_start > now()
    and not exists (
      select 1 from public.bookings b
      where b.therapist_id = c.therapist_id
        and b.status in ('pending', 'confirmed')
        and tstzrange(b.start_at, b.end_at, '[)') && tstzrange(c.candidate_start, c.candidate_end, '[)')
    )
  order by c.candidate_start;
$$;

create or replace function public.get_options_for_start_time(
  p_location_id uuid,
  p_start_at timestamptz
)
returns table (
  therapist_id uuid,
  therapist_display_name text,
  service_slug text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    case when t.public_display then t.id else null end,
    case when t.public_display then t.display_name else null end,
    s.slug
  from public.daily_rosters dr
  join public.therapists t on t.id = dr.therapist_id and t.active
  join public.locations l on l.id = dr.location_id and l.active
  join public.therapist_services ts on ts.therapist_id = dr.therapist_id
  join public.services s on s.id = ts.service_id and s.active
  where dr.location_id = p_location_id
    and dr.date = (p_start_at at time zone 'Australia/Adelaide')::date
    and dr.active
    and p_start_at >= ((dr.date + dr.start_time) at time zone 'Australia/Adelaide')
    and p_start_at + make_interval(mins => s.duration_minutes)
      <= ((dr.date + dr.end_time) at time zone 'Australia/Adelaide')
    and not exists (
      select 1 from public.bookings b
      where b.therapist_id = dr.therapist_id
        and b.status in ('pending', 'confirmed')
        and tstzrange(b.start_at, b.end_at, '[)')
          && tstzrange(p_start_at, p_start_at + make_interval(mins => s.duration_minutes), '[)')
    )
  order by t.public_display desc, t.display_name nulls last, s.slug;
$$;

create or replace function public.create_booking_internal(
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
  v_service public.services%rowtype;
  v_roster record;
  v_end_at timestamptz;
  v_reference text;
  v_booking_id uuid;
  v_local_start timestamp;
begin
  p_customer_name := btrim(coalesce(p_customer_name, ''));
  p_customer_phone := btrim(coalesce(p_customer_phone, ''));
  p_customer_email := lower(btrim(coalesce(p_customer_email, '')));

  if length(p_customer_name) < 2 or length(p_customer_name) > 150 then
    raise exception using errcode = '22023', message = 'INVALID_CUSTOMER_NAME';
  end if;
  if length(p_customer_phone) < 6 or length(p_customer_phone) > 40 then
    raise exception using errcode = '22023', message = 'INVALID_CUSTOMER_PHONE';
  end if;
  if p_customer_email <> ''
     and p_customer_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception using errcode = '22023', message = 'INVALID_CUSTOMER_EMAIL';
  end if;
  if length(coalesce(p_notes, '')) > 2000 then
    raise exception using errcode = '22023', message = 'NOTES_TOO_LONG';
  end if;
  if p_start_at <= now() then
    raise exception using errcode = '22023', message = 'BOOKING_MUST_BE_IN_FUTURE';
  end if;

  select * into v_service
  from public.services s
  where s.id = p_service_id and s.active;
  if not found then
    raise exception using errcode = '22023', message = 'SERVICE_NOT_AVAILABLE';
  end if;

  if not exists (
    select 1 from public.locations l where l.id = p_location_id and l.active
  ) then
    raise exception using errcode = '22023', message = 'LOCATION_NOT_AVAILABLE';
  end if;

  v_end_at := p_start_at + make_interval(mins => v_service.duration_minutes);
  v_local_start := p_start_at at time zone 'Australia/Adelaide';
  if extract(second from v_local_start) <> 0
     or mod(extract(minute from v_local_start)::integer, 15) <> 0 then
    raise exception using errcode = '22023', message = 'INVALID_SLOT_INTERVAL';
  end if;

  for v_roster in
    select dr.*
    from public.daily_rosters dr
    join public.therapists t on t.id = dr.therapist_id and t.active
    join public.therapist_services ts on ts.therapist_id = dr.therapist_id
      and ts.service_id = p_service_id
    where dr.location_id = p_location_id
      and dr.date = (p_start_at at time zone 'Australia/Adelaide')::date
      and dr.active
      and (
        p_therapist_id is null
        or dr.therapist_id = p_therapist_id
      )
      and (
        p_therapist_id is null
        or t.public_display
        or public.is_admin()
      )
      and p_start_at >= ((dr.date + dr.start_time) at time zone 'Australia/Adelaide')
      and v_end_at <= ((dr.date + dr.end_time) at time zone 'Australia/Adelaide')
    order by dr.therapist_id
  loop
    begin
      v_reference := 'CBC-' || upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 10));
      insert into public.bookings (
        reference,
        customer_name,
        customer_phone,
        customer_email,
        location_id,
        service_id,
        therapist_id,
        daily_roster_id,
        start_at,
        end_at,
        status,
        notes
      ) values (
        v_reference,
        p_customer_name,
        p_customer_phone,
        p_customer_email,
        p_location_id,
        p_service_id,
        v_roster.therapist_id,
        v_roster.id,
        p_start_at,
        v_end_at,
        'pending',
        coalesce(p_notes, '')
      ) returning id into v_booking_id;

      return jsonb_build_object(
        'bookingId', v_booking_id,
        'reference', v_reference,
        'therapistId', v_roster.therapist_id,
        'dailyRosterId', v_roster.id,
        'startAt', p_start_at,
        'endAt', v_end_at,
        'status', 'pending'
      );
    exception
      when exclusion_violation then
        if p_therapist_id is not null then
          raise exception using errcode = '23P01', message = 'SLOT_UNAVAILABLE';
        end if;
    end;
  end loop;

  raise exception using errcode = 'P0001', message = 'SLOT_UNAVAILABLE';
end;
$$;

revoke all on function public.get_open_start_times(uuid, date, integer) from public;
revoke all on function public.get_options_for_start_time(uuid, timestamptz) from public;
grant execute on function public.get_open_start_times(uuid, date, integer) to anon, authenticated;
grant execute on function public.get_options_for_start_time(uuid, timestamptz) to anon, authenticated;

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

  if not exists (
    select 1
    from public.therapist_services ts
    where ts.therapist_id = p_therapist_id
      and ts.service_id = v_booking.service_id
  ) then
    raise exception using errcode = '22023', message = 'THERAPIST_CANNOT_PERFORM_SERVICE';
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

create or replace function public.admin_update_booking_appointment_internal(
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
    from public.therapist_services ts
    where ts.therapist_id = p_therapist_id
      and ts.service_id = v_booking.service_id
  ) then
    raise exception using errcode = '22023', message = 'THERAPIST_CANNOT_PERFORM_SERVICE';
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

revoke all on function public.admin_update_booking_appointment_internal(
  uuid, uuid, uuid, timestamptz, timestamptz, public.booking_calendar_status
) from public;

notify pgrst, 'reload schema';
