create or replace function public.get_available_slots(
  p_location_id uuid,
  p_service_id uuid,
  p_date date,
  p_therapist_id uuid default null,
  p_slot_interval_minutes integer default 15
)
returns table (
  slot_start timestamptz,
  slot_end timestamptz,
  daily_roster_id uuid,
  therapist_id uuid,
  therapist_display_name text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with requested_service as (
    select s.id, s.duration_minutes
    from public.services s
    where s.id = p_service_id and s.active
  ),
  eligible_rosters as (
    select
      dr.id,
      dr.therapist_id,
      dr.date,
      dr.start_time,
      dr.end_time,
      rs.duration_minutes,
      t.public_display,
      case when t.public_display then t.display_name else null end as display_name
    from public.daily_rosters dr
    join public.therapists t on t.id = dr.therapist_id and t.active
    join requested_service rs on true
    join public.roster_services rsvc
      on rsvc.daily_roster_id = dr.id and rsvc.service_id = rs.id
    join public.locations l on l.id = dr.location_id and l.active
    where dr.location_id = p_location_id
      and dr.date = p_date
      and dr.active
      and (
        p_therapist_id is null
        or (t.public_display and dr.therapist_id = p_therapist_id)
      )
  ),
  candidates as (
    select
      gs as candidate_start,
      gs + make_interval(mins => er.duration_minutes) as candidate_end,
      er.id as roster_id,
      er.therapist_id,
      er.public_display,
      er.display_name
    from eligible_rosters er
    cross join lateral generate_series(
      (er.date + er.start_time) at time zone 'Australia/Adelaide',
      ((er.date + er.end_time) at time zone 'Australia/Adelaide')
        - make_interval(mins => er.duration_minutes),
      make_interval(
        mins => case
          when p_slot_interval_minutes in (15, 30) then p_slot_interval_minutes
          else 15
        end
      )
    ) gs
  )
  select
    c.candidate_start,
    c.candidate_end,
    case when c.public_display then c.roster_id else null end,
    case when c.public_display then c.therapist_id else null end,
    c.display_name
  from candidates c
  where c.candidate_start > now()
    and not exists (
      select 1
      from public.bookings b
      where b.therapist_id = c.therapist_id
        and b.status in ('pending', 'confirmed')
        and tstzrange(b.start_at, b.end_at, '[)')
          && tstzrange(c.candidate_start, c.candidate_end, '[)')
    )
  order by c.candidate_start, c.display_name nulls last, c.therapist_id;
$$;

revoke all on function public.get_available_slots(uuid, uuid, date, uuid, integer) from public;
grant execute on function public.get_available_slots(uuid, uuid, date, uuid, integer)
  to anon, authenticated;

create or replace function public.create_booking(
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
  if p_customer_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
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
    join public.roster_services rs
      on rs.daily_roster_id = dr.id and rs.service_id = p_service_id
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
        -- For "Any Available Therapist", continue to the next eligible roster.
    end;
  end loop;

  raise exception using errcode = 'P0001', message = 'SLOT_UNAVAILABLE';
end;
$$;

revoke all on function public.create_booking(text, text, text, uuid, uuid, timestamptz, uuid, text) from public;
grant execute on function public.create_booking(text, text, text, uuid, uuid, timestamptz, uuid, text)
  to anon, authenticated;

create or replace function public.upsert_daily_roster(
  p_roster_id uuid,
  p_date date,
  p_location_id uuid,
  p_therapist_id uuid,
  p_start_time time,
  p_end_time time,
  p_active boolean,
  p_service_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roster_id uuid;
begin
  if not public.can_manage_location(p_location_id) then
    raise exception using errcode = '42501', message = 'ADMIN_ACCESS_REQUIRED';
  end if;
  if p_start_time >= p_end_time then
    raise exception using errcode = '22023', message = 'INVALID_ROSTER_HOURS';
  end if;
  if not exists (
    select 1 from public.locations l where l.id = p_location_id and l.active
  ) then
    raise exception using errcode = '22023', message = 'LOCATION_NOT_ACTIVE';
  end if;
  if not exists (
    select 1 from public.therapists t where t.id = p_therapist_id and t.active
  ) then
    raise exception using errcode = '22023', message = 'THERAPIST_NOT_ACTIVE';
  end if;

  if p_roster_id is null then
    insert into public.daily_rosters (
      date, location_id, therapist_id, start_time, end_time, active
    ) values (
      p_date, p_location_id, p_therapist_id, p_start_time, p_end_time, p_active
    )
    on conflict (date, location_id, therapist_id) do update set
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      active = excluded.active
    returning id into v_roster_id;
  else
    if not exists (
      select 1 from public.daily_rosters dr
      where dr.id = p_roster_id and public.can_manage_location(dr.location_id)
    ) then
      raise exception using errcode = '42501', message = 'ROSTER_ACCESS_DENIED';
    end if;

    update public.daily_rosters
    set date = p_date,
        location_id = p_location_id,
        therapist_id = p_therapist_id,
        start_time = p_start_time,
        end_time = p_end_time,
        active = p_active
    where id = p_roster_id
    returning id into v_roster_id;
  end if;

  delete from public.roster_services where daily_roster_id = v_roster_id;

  if p_service_ids is null then
    insert into public.roster_services (daily_roster_id, service_id)
    select v_roster_id, ts.service_id
    from public.therapist_services ts
    join public.services s on s.id = ts.service_id and s.active
    where ts.therapist_id = p_therapist_id
    on conflict do nothing;
  else
    insert into public.roster_services (daily_roster_id, service_id)
    select v_roster_id, s.id
    from public.services s
    where s.id = any(p_service_ids) and s.active
    on conflict do nothing;
  end if;

  return v_roster_id;
end;
$$;

revoke all on function public.upsert_daily_roster(uuid, date, uuid, uuid, time, time, boolean, uuid[]) from public;
grant execute on function public.upsert_daily_roster(uuid, date, uuid, uuid, time, time, boolean, uuid[])
  to authenticated;
