# Phase 2 Supabase setup

This foundation uses Supabase Auth for administrators and PostgreSQL for
availability, roster validation and booking conflict prevention. No payment or
Stripe configuration is included.

## 1. Create and link a Supabase project

Install the Supabase CLI, sign in, and link this repository to the intended
project. From the repository root run:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migrations create the schema, RLS policies, admin helpers and booking
functions. Seed the initial 13 locations and 44 brochure services with:

```bash
supabase db reset --linked
```

`db reset --linked` is destructive and is intended only for a new/empty Phase
2 project. For a project containing production data, apply the migrations with
`supabase db push`, then run `supabase/seed.sql` once in the Supabase SQL
Editor instead.

The source repository does not contain full street addresses. The seed keeps
the exact existing store names and phone numbers and uses the existing shopping
centre/area labels as the initial address text. An administrator can replace
these with complete street addresses on the Locations page.

## 2. Environment variables

Copy `.env.example` to `.env.local` and provide:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Both values are available under **Project Settings → API** in Supabase. The
anon key is safe for browser use when RLS remains enabled. Never put the
service-role key in a `NEXT_PUBLIC_` variable or commit it to Git.

This foundation does not require a service-role key. Public booking creation
uses the narrowly scoped `create_booking` database function, not direct table
inserts.

## 3. Create the first global administrator

1. In Supabase Dashboard, open **Authentication → Users**.
2. Choose **Add user → Create new user**, enter the manager email and a strong
   temporary password, and mark the email confirmed if appropriate.
3. Copy the new user's UUID.
4. Run the following in the SQL Editor, replacing the email:

```sql
insert into public.admin_users (user_id, role)
select id, 'global_admin'::public.admin_role
from auth.users
where email = 'manager@example.com'
on conflict (user_id) do update set
  role = excluded.role,
  location_id = null;
```

An authenticated Supabase user is not automatically an administrator. Access
to admin data requires a corresponding `admin_users` row.

The schema already supports future store managers. Add one with:

```sql
insert into public.admin_users (user_id, role, location_id)
select
  u.id,
  'store_manager'::public.admin_role,
  l.id
from auth.users u
cross join public.locations l
where u.email = 'store.manager@example.com'
  and l.slug = 'city-myer-centre';
```

Store-manager RLS access is restricted to the assigned location.

## 4. Configure therapists and daily rosters

Before a date becomes bookable, a manager must:

1. Create each real therapist under **Admin → Therapists**.
2. Assign the therapist's default services. Category selections in the UI
   should expand to the active services in that category and populate
   `therapist_services`.
3. Open **Admin → Roster**, select a location and date, and add the therapists
   working that shift.
4. Set each therapist's start/end time and the services available for that
   particular shift. Saving calls `upsert_daily_roster`; when service IDs are
   omitted it copies the therapist's defaults into `roster_services`.
5. Mark a shift inactive to withdraw it without deleting history. A roster with
   existing bookings cannot be deleted because bookings retain their roster
   audit reference.

If there is no active eligible roster for a location/date/service,
`get_available_slots` returns no rows. The public booking page must display:

> No online availability for this date. Please call the store to book.

## 5. Booking and concurrency behaviour

- All roster times are interpreted in `Australia/Adelaide`, including daylight
  saving transitions.
- `get_available_slots` generates 15-minute starts and omits overlaps with
  pending or confirmed bookings.
- `create_booking` recalculates duration from the active service, validates the
  location, roster, therapist, service assignment, shift bounds and contact
  fields on the server.
- For “Any Available Therapist”, `create_booking` tries eligible rostered
  therapists until one can be inserted.
- A PostgreSQL GiST exclusion constraint prevents overlapping pending or
  confirmed bookings for the same therapist. This is the final protection
  against two customers claiming the same slot concurrently.
- A second exclusion constraint prevents a therapist being rostered in
  overlapping shifts at different locations.
- Cancelled, completed and no-show bookings do not block future availability.

Public users have no direct read access to rosters, therapists or bookings and
no direct insert access to bookings. The availability function only exposes a
therapist name when `therapists.public_display` is enabled.

## 6. Useful verification queries

```sql
select count(*) from public.locations; -- 13
select count(*) from public.services;  -- 44

select public.get_available_slots(
  (select id from public.locations where slug = 'city-myer-centre'),
  (select id from public.services where slug = 'relaxation-60'),
  current_date + 1,
  null,
  15
);
```

The availability query returns no rows until an active therapist and matching
daily roster have been configured.

