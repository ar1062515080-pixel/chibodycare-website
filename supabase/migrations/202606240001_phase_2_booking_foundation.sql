create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.booking_status as enum (
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

create type public.admin_role as enum ('global_admin', 'store_manager');

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  phone text not null,
  address text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.location_opening_hours (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time time,
  close_time time,
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (location_id, day_of_week),
  check (
    (closed and open_time is null and close_time is null)
    or
    (not closed and open_time is not null and close_time is not null and open_time < close_time)
  )
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.therapists (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  internal_name text not null,
  active boolean not null default true,
  public_display boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.therapist_services (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  unique (therapist_id, service_id)
);

create table public.daily_rosters (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  location_id uuid not null references public.locations(id) on delete restrict,
  therapist_id uuid not null references public.therapists(id) on delete restrict,
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (start_time < end_time),
  unique (date, location_id, therapist_id),
  exclude using gist (
    therapist_id with =,
    (tsrange(date + start_time, date + end_time, '[)')) with &&
  ) where (active)
);

create table public.roster_services (
  id uuid primary key default gen_random_uuid(),
  daily_roster_id uuid not null references public.daily_rosters(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  unique (daily_roster_id, service_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  location_id uuid not null references public.locations(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  therapist_id uuid not null references public.therapists(id) on delete restrict,
  daily_roster_id uuid not null references public.daily_rosters(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.booking_status not null default 'pending',
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (start_at < end_at),
  exclude using gist (
    therapist_id with =,
    (tstzrange(start_at, end_at, '[)')) with &&
  ) where (status in ('pending', 'confirmed'))
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null default 'global_admin',
  location_id uuid references public.locations(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (
    (role = 'global_admin' and location_id is null)
    or (role = 'store_manager' and location_id is not null)
  )
);

create index daily_rosters_lookup_idx
  on public.daily_rosters (location_id, date, active);
create index roster_services_service_idx
  on public.roster_services (service_id, daily_roster_id);
create index bookings_location_start_idx
  on public.bookings (location_id, start_at);
create index bookings_therapist_start_idx
  on public.bookings (therapist_id, start_at);
create index bookings_status_start_idx
  on public.bookings (status, start_at);

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
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_manage_location(uuid) to authenticated;
grant execute on function public.is_global_admin() to authenticated;

alter table public.locations enable row level security;
alter table public.location_opening_hours enable row level security;
alter table public.services enable row level security;
alter table public.therapists enable row level security;
alter table public.therapist_services enable row level security;
alter table public.daily_rosters enable row level security;
alter table public.roster_services enable row level security;
alter table public.bookings enable row level security;
alter table public.admin_users enable row level security;

create policy "Public can read active locations"
on public.locations for select
to anon, authenticated
using (active or public.is_admin());

create policy "Admins manage locations"
on public.locations for all
to authenticated
using (public.can_manage_location(id))
with check (public.can_manage_location(id));

create policy "Public can read opening hours"
on public.location_opening_hours for select
to anon, authenticated
using (
  exists (
    select 1 from public.locations l
    where l.id = location_id and (l.active or public.is_admin())
  )
);

create policy "Admins manage opening hours"
on public.location_opening_hours for all
to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

create policy "Public can read active services"
on public.services for select
to anon, authenticated
using (active or public.is_admin());

create policy "Global admins manage services"
on public.services for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage therapists"
on public.therapists for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage therapist services"
on public.therapist_services for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins read rosters"
on public.daily_rosters for select
to authenticated
using (public.can_manage_location(location_id));

create policy "Admins manage rosters"
on public.daily_rosters for all
to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

create policy "Admins read roster services"
on public.roster_services for select
to authenticated
using (
  exists (
    select 1 from public.daily_rosters dr
    where dr.id = daily_roster_id
      and public.can_manage_location(dr.location_id)
  )
);

create policy "Admins manage roster services"
on public.roster_services for all
to authenticated
using (
  exists (
    select 1 from public.daily_rosters dr
    where dr.id = daily_roster_id
      and public.can_manage_location(dr.location_id)
  )
)
with check (
  exists (
    select 1 from public.daily_rosters dr
    where dr.id = daily_roster_id
      and public.can_manage_location(dr.location_id)
  )
);

create policy "Admins read bookings"
on public.bookings for select
to authenticated
using (public.can_manage_location(location_id));

create policy "Admins update bookings"
on public.bookings for update
to authenticated
using (public.can_manage_location(location_id))
with check (public.can_manage_location(location_id));

create policy "Admins read own admin record"
on public.admin_users for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "Global admins manage admin records"
on public.admin_users for all
to authenticated
using (public.is_global_admin())
with check (public.is_global_admin());

grant select on public.locations, public.location_opening_hours, public.services
  to anon, authenticated;
grant insert, update, delete on public.locations, public.location_opening_hours,
  public.services, public.therapists, public.therapist_services,
  public.daily_rosters, public.roster_services, public.admin_users
  to authenticated;
grant select on public.therapists, public.therapist_services,
  public.daily_rosters, public.roster_services, public.bookings,
  public.admin_users
  to authenticated;
grant update (status, notes) on public.bookings to authenticated;
