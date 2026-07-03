-- Support the public flow: location -> time -> therapist -> service.
-- The final create_booking RPC remains authoritative and rechecks roster,
-- capability and booking overlap inside the database transaction.

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
  with roster_services_with_duration as (
    select dr.id as roster_id, dr.therapist_id, dr.date, dr.start_time,
      dr.end_time, s.duration_minutes
    from public.daily_rosters dr
    join public.therapists t on t.id = dr.therapist_id and t.active
    join public.roster_services rs on rs.daily_roster_id = dr.id
    join public.services s on s.id = rs.service_id and s.active
    join public.locations l on l.id = dr.location_id and l.active
    where dr.location_id = p_location_id and dr.date = p_date and dr.active
  ), candidates as (
    select rswd.therapist_id,
      gs as candidate_start,
      gs + make_interval(mins => rswd.duration_minutes) as candidate_end
    from roster_services_with_duration rswd
    cross join lateral generate_series(
      (rswd.date + rswd.start_time) at time zone 'Australia/Adelaide',
      ((rswd.date + rswd.end_time) at time zone 'Australia/Adelaide')
        - make_interval(mins => rswd.duration_minutes),
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
  join public.roster_services rs on rs.daily_roster_id = dr.id
  join public.services s on s.id = rs.service_id and s.active
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
  order by therapist_display_name nulls last, s.slug;
$$;

revoke all on function public.get_open_start_times(uuid, date, integer) from public;
revoke all on function public.get_options_for_start_time(uuid, timestamptz) from public;
grant execute on function public.get_open_start_times(uuid, date, integer) to anon, authenticated;
grant execute on function public.get_options_for_start_time(uuid, timestamptz) to anon, authenticated;
