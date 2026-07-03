create or replace function public.get_public_therapists_for_location(p_location_id uuid)
returns table (therapist_id uuid, display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct t.id, t.display_name
  from public.therapists t
  join public.daily_rosters dr on dr.therapist_id = t.id
  where dr.location_id = p_location_id
    and dr.active
    and dr.date >= current_date
    and t.active
    and t.public_display
  order by t.display_name;
$$;

revoke all on function public.get_public_therapists_for_location(uuid) from public;
grant execute on function public.get_public_therapists_for_location(uuid) to anon, authenticated;
