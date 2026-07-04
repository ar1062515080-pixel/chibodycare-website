import { BookingCalendar, type CalendarBooking, type CalendarStatus, type CalendarTherapist } from "@/components/admin/booking-calendar";
import { updateBookingCalendar } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAdminLocale, tr } from "@/lib/admin-i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TIME_ZONE = "Australia/Adelaide";
const calendarStatuses = ["unpaid", "paid", "no_show"] as const;
const calendarStatusLabels = {
  unpaid: { en: "Unpaid", zh: "未付款" },
  paid: { en: "Paid", zh: "已付款" },
  no_show: { en: "No-show", zh: "未到店" },
} as const;

type TherapistRelation = { id: string; display_name: string };
type BookingRow = {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  start_at: string;
  end_at: string;
  status: string;
  calendar_status: CalendarStatus | null;
  is_any_professional: boolean;
  therapist_id: string;
  services: { name?: string } | Array<{ name?: string }> | null;
};

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function localDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function minutesFromTime(value: string) {
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

function statusClass(status: CalendarStatus) {
  return { unpaid: "border-amber-400 bg-amber-50", paid: "border-sage-500 bg-sage-100", no_show: "border-rose-400 bg-rose-50" }[status];
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ date?: string; location?: string; status?: string }> }) {
  const params = await searchParams;
  const locale = await getAdminLocale();
  const supabase = await createSupabaseServerClient();
  const date = params.date || new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
  const selectedStatus = calendarStatuses.includes(params.status as CalendarStatus) ? params.status as CalendarStatus : "";

  const { data: locationRows } = await supabase.from("locations").select("id,name").eq("active", true).order("name");
  const locations = locationRows ?? [];
  const locationId = params.location || locations[0]?.id || "";
  const [{ data: rosterRows }, { data: bookingRows }] = await Promise.all([
    supabase.from("daily_rosters").select("therapist_id,start_time,end_time,therapists(id,display_name)").eq("date", date).eq("location_id", locationId).eq("active", true).order("start_time"),
    supabase.from("bookings").select("id,reference,customer_name,customer_phone,start_at,end_at,status,calendar_status,is_any_professional,therapist_id,services(name)").eq("location_id", locationId).neq("status", "cancelled").gte("start_at", `${shiftDate(date, -1)}T00:00:00Z`).lt("start_at", `${shiftDate(date, 1)}T23:59:59Z`).order("start_at"),
  ]);

  const therapistMap = new Map<string, CalendarTherapist>();
  for (const roster of rosterRows ?? []) {
    const therapist = relationOne(roster.therapists as unknown as TherapistRelation | TherapistRelation[] | null);
    if (therapist) therapistMap.set(therapist.id, { id: therapist.id, displayName: therapist.display_name });
  }
  const therapists = [...therapistMap.values()];
  const bookings = ((bookingRows ?? []) as unknown as BookingRow[])
    .filter((booking) => localDate(booking.start_at) === date)
    .map((booking): CalendarBooking => {
      const service = relationOne(booking.services);
      const calendarStatus = booking.calendar_status ?? (booking.status === "no_show" ? "no_show" : "unpaid");
      return { id: booking.id, reference: booking.reference, customerName: booking.customer_name, customerPhone: booking.customer_phone, serviceName: service?.name || tr(locale, "Treatment", "服务项目"), therapistId: booking.therapist_id, startAt: booking.start_at, endAt: booking.end_at, calendarStatus, isAnyProfessional: booking.is_any_professional };
    })
    .filter((booking) => !selectedStatus || booking.calendarStatus === selectedStatus);

  const rosterStarts = (rosterRows ?? []).map((roster) => minutesFromTime(String(roster.start_time)));
  const rosterEnds = (rosterRows ?? []).map((roster) => minutesFromTime(String(roster.end_time)));
  const startMinute = Math.floor(Math.min(...rosterStarts, 540) / 30) * 30;
  const endMinute = Math.ceil(Math.max(...rosterEnds, 1080) / 30) * 30;
  const selectedLocation = locations.find((location) => location.id === locationId)?.name;

  return <div>
    <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Bookings", "预约管理")}</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-4xl text-brown-900">{tr(locale, "Daily appointment calendar", "每日预约日历")}</h1><p className="mt-1 text-sm text-brown-700/65">{selectedLocation} · {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-AU", { dateStyle: "full", timeZone: TIME_ZONE }).format(new Date(`${date}T12:00:00Z`))}</p></div><div className="flex flex-wrap gap-3 text-xs text-brown-700/70">{calendarStatuses.map((status) => <span key={status} className="flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full border ${statusClass(status)}`} />{calendarStatusLabels[status][locale]}</span>)}</div></div>

    <form className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-sand-200 bg-cream-50 p-4">
      <label className="text-xs font-medium text-brown-700">{tr(locale, "Date", "日期")}<input type="date" name="date" defaultValue={date} className="mt-1 block rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
      <label className="min-w-60 flex-1 text-xs font-medium text-brown-700">{tr(locale, "Studio", "门店")}<select name="location" defaultValue={locationId} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      <label className="min-w-40 text-xs font-medium text-brown-700">{tr(locale, "Status", "状态")}<select name="status" defaultValue={selectedStatus} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"><option value="">{tr(locale, "All statuses", "全部状态")}</option>{calendarStatuses.map((status) => <option key={status} value={status}>{calendarStatusLabels[status][locale]}</option>)}</select></label>
      <SubmitButton pendingLabel={tr(locale, "Loading…", "正在加载…")} className="self-end rounded-full bg-brown-900 px-5 py-2.5 text-sm text-cream-50">{tr(locale, "View calendar", "查看日历")}</SubmitButton>
    </form>

    {therapists.length ? <div className="mt-6"><BookingCalendar therapists={therapists} initialBookings={bookings} startMinute={startMinute} endMinute={endMinute} locale={locale} updateAction={updateBookingCalendar} /></div> : <div className="mt-6 rounded-2xl border border-dashed border-sand-200 bg-cream-50 p-10 text-center"><p className="font-serif text-2xl">{tr(locale, "No therapists rostered", "当天没有按摩师排班")}</p><p className="mt-2 text-sm text-brown-700/60">{tr(locale, "Add therapists to the daily roster to build this calendar.", "请先在每日排班中添加按摩师，日历才会显示对应列。")}</p></div>}
  </div>;
}
