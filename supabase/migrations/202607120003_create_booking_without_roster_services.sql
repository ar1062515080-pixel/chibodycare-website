-- Roster service check is no longer used in daily roster management.
-- A therapist rostered at a store/date can receive an admin or public booking
-- as long as the time fits their shift and does not overlap an active booking.
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

revoke all on function public.create_booking_internal(
  text, text, text, uuid, uuid, timestamptz, uuid, text
) from public, anon, authenticated;

notify pgrst, 'reload schema';
