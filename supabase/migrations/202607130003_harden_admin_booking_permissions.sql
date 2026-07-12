-- Final production repair for admin booking pages.
-- Some projects were created before later admin pages existed, so the
-- authenticated role can hit a plain "permission denied for table bookings"
-- when the bookings page reads or writes directly through PostgREST.

grant usage on schema public to anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_location(p_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and (au.role = 'global_admin' or au.location_id = p_location_id)
  );
$$;

create or replace function public.is_global_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid() and au.role = 'global_admin'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.can_manage_location(uuid) from public;
revoke all on function public.is_global_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.can_manage_location(uuid) to authenticated;
grant execute on function public.is_global_admin() to authenticated;

grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.bookings to authenticated;
grant select on public.locations, public.services, public.therapists, public.daily_rosters,
  public.therapist_services, public.location_therapists to authenticated;

drop policy if exists "Admins read bookings" on public.bookings;
drop policy if exists "Admins insert bookings" on public.bookings;
drop policy if exists "Admins update bookings" on public.bookings;
drop policy if exists "Admins delete bookings" on public.bookings;
drop policy if exists "Authenticated admins manage bookings" on public.bookings;

create policy "Authenticated admins manage bookings"
on public.bookings
for all
to authenticated
using (public.can_manage_location(location_id) or public.is_global_admin())
with check (public.can_manage_location(location_id) or public.is_global_admin());

-- Repair related admin reads used by the booking calendar.
drop policy if exists "Authenticated admins read daily rosters" on public.daily_rosters;
create policy "Authenticated admins read daily rosters"
on public.daily_rosters
for select
to authenticated
using (public.can_manage_location(location_id) or public.is_global_admin());

drop policy if exists "Authenticated admins read location therapists" on public.location_therapists;
create policy "Authenticated admins read location therapists"
on public.location_therapists
for select
to authenticated
using (public.can_manage_location(location_id) or public.is_global_admin());

notify pgrst, 'reload schema';
