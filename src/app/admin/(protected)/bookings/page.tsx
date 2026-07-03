import { updateBookingStatus } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAdminLocale, statusLabels, tr, type AdminLocale } from "@/lib/admin-i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statuses = ["pending", "confirmed", "cancelled", "completed", "no_show"] as const;
const ROW_HEIGHT = 56;
const SLOT_MINUTES = 30;
const ADELAIDE_TIME_ZONE = "Australia/Adelaide";

type BookingStatus = (typeof statuses)[number];
type Therapist = { id: string; display_name: string };
type Booking = {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  therapist_id: string;
  services: { name?: string } | null;
  therapists: { display_name?: string } | null;
};

function localDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ADELAIDE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function localMinutes(value: string) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: ADELAIDE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function timeLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function bookingTime(booking: Booking, locale: AdminLocale) {
  const formatter = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-AU", {
    timeZone: ADELAIDE_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(booking.start_at))}–${formatter.format(new Date(booking.end_at))}`;
}

function statusCardClass(status: BookingStatus) {
  return {
    pending: "border-amber-300 bg-amber-50 text-amber-950",
    confirmed: "border-sage-400 bg-sage-100 text-sage-800",
    cancelled: "border-stone-300 bg-stone-100 text-stone-600",
    completed: "border-sky-300 bg-sky-50 text-sky-950",
    no_show: "border-rose-300 bg-rose-50 text-rose-950",
  }[status];
}

function StatusControl({ booking, locale, compact = false }: { booking: Booking; locale: AdminLocale; compact?: boolean }) {
  return (
    <form action={updateBookingStatus} className={`flex gap-1 ${compact ? "mt-2" : "mt-3"}`}>
      <input type="hidden" name="id" value={booking.id} />
      <select
        name="status"
        defaultValue={booking.status}
        aria-label={tr(locale, "Appointment status", "预约状态")}
        className="min-w-0 flex-1 rounded-md border border-current/20 bg-white/70 px-1.5 py-1 text-[11px]"
      >
        {statuses.map((status) => <option key={status} value={status}>{statusLabels[status][locale]}</option>)}
      </select>
      <SubmitButton
        pendingLabel="…"
        className="rounded-md bg-brown-900 px-2 py-1 text-[11px] text-cream-50"
      >
        {tr(locale, "Save", "保存")}
      </SubmitButton>
    </form>
  );
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; location?: string; status?: string }>;
}) {
  const params = await searchParams;
  const locale = await getAdminLocale();
  const supabase = await createSupabaseServerClient();
  const date = params.date || new Intl.DateTimeFormat("en-CA", { timeZone: ADELAIDE_TIME_ZONE }).format(new Date());

  const { data: locationRows } = await supabase.from("locations").select("id,name").eq("active", true).order("name");
  const locations = locationRows ?? [];
  const locationId = params.location || locations[0]?.id || "";

  const [{ data: rosterRows }, { data: bookingRows }] = await Promise.all([
    supabase
      .from("daily_rosters")
      .select("therapist_id,start_time,end_time,therapists(id,display_name)")
      .eq("date", date)
      .eq("location_id", locationId)
      .eq("active", true)
      .order("start_time"),
    supabase
      .from("bookings")
      .select("id,reference,customer_name,customer_phone,start_at,end_at,status,therapist_id,services(name),therapists(display_name)")
      .eq("location_id", locationId)
      // Fetch a deliberately wider UTC window, then filter in Adelaide time.
      // This remains correct across both ACST and daylight-saving transitions.
      .gte("start_at", `${shiftDate(date, -1)}T00:00:00Z`)
      .lt("start_at", `${shiftDate(date, 1)}T23:59:59Z`)
      .order("start_at"),
  ]);

  const therapistMap = new Map<string, Therapist>();
  for (const roster of rosterRows ?? []) {
    const relatedTherapists = roster.therapists as unknown as Therapist | Therapist[] | null;
    const therapist = Array.isArray(relatedTherapists) ? relatedTherapists[0] : relatedTherapists;
    if (therapist?.id) therapistMap.set(therapist.id, therapist);
  }
  const therapists = [...therapistMap.values()];
  const allBookings = (bookingRows ?? []) as unknown as Booking[];
  const bookings = allBookings.filter((booking) => localDate(booking.start_at) === date && (!params.status || booking.status === params.status));

  const rosterStart = (rosterRows ?? []).map((roster) => Number(String(roster.start_time).slice(0, 2)) * 60 + Number(String(roster.start_time).slice(3, 5)));
  const rosterEnd = (rosterRows ?? []).map((roster) => Number(String(roster.end_time).slice(0, 2)) * 60 + Number(String(roster.end_time).slice(3, 5)));
  const startMinute = Math.floor((Math.min(...rosterStart, 9 * 60)) / SLOT_MINUTES) * SLOT_MINUTES;
  const endMinute = Math.ceil((Math.max(...rosterEnd, 18 * 60)) / SLOT_MINUTES) * SLOT_MINUTES;
  const slots = Array.from({ length: Math.max(1, (endMinute - startMinute) / SLOT_MINUTES) }, (_, index) => startMinute + index * SLOT_MINUTES);
  const selectedLocation = locations.find((location) => location.id === locationId)?.name;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Bookings", "预约管理")}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl text-brown-900">{tr(locale, "Daily appointment calendar", "每日预约日历")}</h1>
          <p className="mt-1 text-sm text-brown-700/65">{selectedLocation} · {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-AU", { dateStyle: "full", timeZone: ADELAIDE_TIME_ZONE }).format(new Date(`${date}T12:00:00Z`))}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-brown-700/70">
          {statuses.map((status) => <span key={status} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full border ${statusCardClass(status)}`} />{statusLabels[status][locale]}</span>)}
        </div>
      </div>

      <form className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-sand-200 bg-cream-50 p-4">
        <label className="text-xs font-medium text-brown-700">{tr(locale, "Date", "日期")}<input type="date" name="date" defaultValue={date} className="mt-1 block rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="min-w-60 flex-1 text-xs font-medium text-brown-700">{tr(locale, "Studio", "门店")}<select name="location" defaultValue={locationId} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <label className="min-w-40 text-xs font-medium text-brown-700">{tr(locale, "Status", "状态")}<select name="status" defaultValue={params.status} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"><option value="">{tr(locale, "All statuses", "全部状态")}</option>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status][locale]}</option>)}</select></label>
        <SubmitButton pendingLabel={tr(locale, "Loading…", "正在加载…")} className="self-end rounded-full bg-brown-900 px-5 py-2.5 text-sm text-cream-50">{tr(locale, "View calendar", "查看日历")}</SubmitButton>
      </form>

      {therapists.length ? (
        <>
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-sand-200 bg-cream-50 shadow-sm md:block">
            <div className="grid min-w-max" style={{ gridTemplateColumns: `5rem repeat(${therapists.length}, minmax(13rem, 1fr))` }}>
              <div className="sticky left-0 top-0 z-30 border-b border-r border-sand-200 bg-sand-50 p-3 text-xs font-medium uppercase tracking-wider text-brown-700/60">{tr(locale, "Time", "时间")}</div>
              {therapists.map((therapist) => <div key={therapist.id} className="sticky top-0 z-20 border-b border-r border-sand-200 bg-sand-50 px-4 py-3"><p className="font-serif text-lg text-brown-900">{therapist.display_name}</p><p className="text-[10px] uppercase tracking-wider text-sage-700">{tr(locale, "Rostered today", "今日上班")}</p></div>)}

              <div className="sticky left-0 z-20 border-r border-sand-200 bg-cream-50">
                {slots.map((slot) => <div key={slot} className="border-b border-sand-100 px-3 pt-1 text-right text-[11px] text-brown-700/55" style={{ height: ROW_HEIGHT }}>{timeLabel(slot)}</div>)}
              </div>
              {therapists.map((therapist) => {
                const therapistBookings = bookings.filter((booking) => booking.therapist_id === therapist.id);
                return <div key={therapist.id} className="relative border-r border-sand-200 bg-[linear-gradient(to_bottom,transparent_55px,#eee3cf_56px)] bg-[length:100%_56px]" style={{ height: slots.length * ROW_HEIGHT }}>
                  {therapistBookings.map((booking) => {
                    const start = localMinutes(booking.start_at);
                    const end = localMinutes(booking.end_at);
                    const top = ((start - startMinute) / SLOT_MINUTES) * ROW_HEIGHT;
                    const height = Math.max(48, ((end - start) / SLOT_MINUTES) * ROW_HEIGHT - 4);
                    return <article key={booking.id} className={`absolute inset-x-1.5 z-10 overflow-hidden rounded-lg border-l-4 p-2 shadow-sm ${statusCardClass(booking.status)}`} style={{ top: top + 2, height }} title={`${booking.customer_name} · ${bookingTime(booking, locale)}`}>
                      <div className="flex items-start justify-between gap-2"><p className="truncate text-xs font-semibold">{booking.customer_name}</p><span className="shrink-0 text-[10px] opacity-70">{bookingTime(booking, locale)}</span></div>
                      <p className="mt-0.5 truncate text-[11px]">{booking.services?.name || tr(locale, "Treatment", "服务项目")}</p>
                      {height >= 92 ? <><p className="truncate text-[10px] opacity-65">{booking.reference} · {booking.customer_phone}</p><StatusControl booking={booking} locale={locale} compact /></> : null}
                    </article>;
                  })}
                </div>;
              })}
            </div>
          </div>

          <div className="mt-6 space-y-5 md:hidden">
            {therapists.map((therapist) => {
              const therapistBookings = bookings.filter((booking) => booking.therapist_id === therapist.id);
              return <section key={therapist.id} className="overflow-hidden rounded-2xl border border-sand-200 bg-cream-50"><header className="border-b border-sand-200 bg-sand-50 px-4 py-3"><h2 className="font-serif text-xl">{therapist.display_name}</h2><p className="text-xs text-brown-700/55">{therapistBookings.length} {tr(locale, "appointments", "个预约")}</p></header><div className="space-y-3 p-3">{therapistBookings.length ? therapistBookings.map((booking) => <article key={booking.id} className={`rounded-xl border-l-4 p-3 ${statusCardClass(booking.status)}`}><div className="flex justify-between gap-3"><div><p className="font-medium">{booking.customer_name}</p><p className="text-xs opacity-75">{booking.services?.name}</p></div><p className="shrink-0 text-xs font-medium">{bookingTime(booking, locale)}</p></div><p className="mt-1 text-xs opacity-60">{booking.reference} · {booking.customer_phone}</p><StatusControl booking={booking} locale={locale} /></article>) : <p className="py-6 text-center text-sm text-brown-700/55">{tr(locale, "No appointments", "暂无预约")}</p>}</div></section>;
            })}
          </div>
        </>
      ) : <div className="mt-6 rounded-2xl border border-dashed border-sand-200 bg-cream-50 p-10 text-center"><p className="font-serif text-2xl text-brown-900">{tr(locale, "No therapists rostered", "当天没有治疗师排班")}</p><p className="mt-2 text-sm text-brown-700/60">{tr(locale, "Add therapists to the daily roster to build this calendar.", "请先在每日排班中添加治疗师，日历才会显示对应列。")}</p></div>}
    </div>
  );
}
