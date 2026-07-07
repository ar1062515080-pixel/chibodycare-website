create table if not exists public.location_therapists (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (location_id, therapist_id)
);

create index if not exists location_therapists_location_idx
  on public.location_therapists(location_id);

create index if not exists location_therapists_therapist_idx
  on public.location_therapists(therapist_id);

insert into public.location_therapists (location_id, therapist_id)
select distinct location_id, therapist_id
from public.daily_rosters
on conflict (location_id, therapist_id) do nothing;

-- Keep therapists that have not yet appeared on a roster visible. They are
-- assigned to the first active store and can subsequently be managed there.
insert into public.location_therapists (location_id, therapist_id)
select first_location.id, therapists.id
from public.therapists
cross join lateral (
  select id from public.locations where active = true order by name limit 1
) first_location
where not exists (
  select 1 from public.location_therapists
  where location_therapists.therapist_id = therapists.id
)
on conflict (location_id, therapist_id) do nothing;

alter table public.location_therapists enable row level security;

drop policy if exists "Admins view location therapists" on public.location_therapists;
create policy "Admins view location therapists"
on public.location_therapists for select to authenticated
using (public.can_manage_location(location_id));

drop policy if exists "Admins manage location therapists" on public.location_therapists;
create policy "Admins manage location therapists"
on public.location_therapists for all to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

grant select, insert, update, delete on public.location_therapists to authenticated;

notify pgrst, 'reload schema';
