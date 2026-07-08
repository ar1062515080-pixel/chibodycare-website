import { saveTherapistPayRate } from "@/app/admin/actions";
import { AutoFilterForm } from "@/components/admin/auto-filter-form";
import { EnterSubmitForm } from "@/components/admin/enter-submit-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAdminLocale, tr } from "@/lib/admin-i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TIME_ZONE = "Australia/Adelaide";
type Therapist = { id: string; display_name: string; pay_rate_cents_per_hour?: number };
type Booking = { therapist_id: string; start_at: string; end_at: string; is_any_professional: boolean; status: string; card_amount_cents: number | null; insurance_amount_cents: number | null; cash_amount_cents: number | null; therapists: Therapist | Therapist[] | null };
type Roster = { date: string; therapist_id: string; therapists: Therapist | Therapist[] | null };
type DailyRecord = { record_date: string; promotion_cents: number; other_income_cents: number; cash_expense_cents: number };
type VoucherSale = { sale_date: string; card_amount_cents: number; hicaps_amount_cents: number; cash_amount_cents: number };

function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }
function cents(value: number | null | undefined) { return value ?? 0; }
function money(value: number) { return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value / 100); }
function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function addDays(value: string, days: number) { const date = new Date(`${value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return isoDate(date); }
function weekStart(value: string) { const date = new Date(`${value}T12:00:00Z`); const day = date.getUTCDay() || 7; date.setUTCDate(date.getUTCDate() - day + 1); return isoDate(date); }
function localDate(value: string) { return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); }
function minutes(booking: Booking) { return Math.max(0, Math.round((new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / 60000)); }

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ location?: string; date?: string }> }) {
  const locale = await getAdminLocale();
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : today;
  const start = weekStart(selectedDate);
  const end = addDays(start, 6);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const { data: locationRows } = await supabase.from("locations").select("id,name").eq("active", true).order("name");
  const locations = locationRows ?? [];
  const locationId = params.location || locations[0]?.id || "";
  const selectedLocation = locations.find((location) => location.id === locationId)?.name ?? "";

  const [rosterResult, bookingResult, dailyResult, voucherResult] = await Promise.all([
    supabase.from("daily_rosters").select("date,therapist_id,therapists(*)").eq("location_id", locationId).eq("active", true).gte("date", start).lte("date", end),
    supabase.from("bookings").select("therapist_id,start_at,end_at,is_any_professional,status,card_amount_cents,insurance_amount_cents,cash_amount_cents,therapists(*)").eq("location_id", locationId).neq("status", "cancelled").gte("start_at", `${addDays(start, -1)}T00:00:00Z`).lt("start_at", `${addDays(end, 2)}T00:00:00Z`),
    supabase.from("daily_store_records").select("record_date,promotion_cents,other_income_cents,cash_expense_cents").eq("location_id", locationId).gte("record_date", start).lte("record_date", end),
    supabase.from("gift_voucher_sales").select("sale_date,card_amount_cents,hicaps_amount_cents,cash_amount_cents").eq("location_id", locationId).gte("sale_date", start).lte("sale_date", end),
  ]);
  const rosters = (rosterResult.data ?? []) as unknown as Roster[];
  const bookings = ((bookingResult.data ?? []) as unknown as Booking[]).filter((booking) => days.includes(localDate(booking.start_at)) && booking.status !== "no_show");
  const dailyRecords = (dailyResult.data ?? []) as DailyRecord[];
  const vouchers = (voucherResult.data ?? []) as VoucherSale[];

  const therapists = new Map<string, Therapist>();
  for (const roster of rosters) { const therapist = one(roster.therapists); if (therapist) therapists.set(therapist.id, therapist); }
  for (const booking of bookings) { const therapist = one(booking.therapists); if (therapist) therapists.set(therapist.id, therapist); }

  const dailyFinance = days.map((date) => {
    const dateBookings = bookings.filter((booking) => localDate(booking.start_at) === date);
    const dateVouchers = vouchers.filter((voucher) => voucher.sale_date === date);
    const record = dailyRecords.find((item) => item.record_date === date);
    const treatmentReceipts = dateBookings.reduce((sum, booking) => sum + cents(booking.card_amount_cents) + cents(booking.insurance_amount_cents) + cents(booking.cash_amount_cents), 0);
    const voucherReceipts = dateVouchers.reduce((sum, voucher) => sum + voucher.card_amount_cents + voucher.hicaps_amount_cents + voucher.cash_amount_cents, 0);
    const expenses = cents(record?.promotion_cents) + cents(record?.other_income_cents) + cents(record?.cash_expense_cents);
    return { date, treatmentReceipts, voucherReceipts, income: treatmentReceipts + voucherReceipts, expenses, net: treatmentReceipts + voucherReceipts - expenses };
  });
  const totals = dailyFinance.reduce((sum, day) => ({ income: sum.income + day.income, expenses: sum.expenses + day.expenses, net: sum.net + day.net }), { income: 0, expenses: 0, net: 0 });
  const dateFormat = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-AU", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

  return <div className="mx-auto max-w-[1500px]">
    <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Accounting & management", "会计与经理报表")}</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-5"><div><h1 className="font-serif text-4xl text-brown-900">{tr(locale, "Finance & payroll", "财务与工资")}</h1><p className="mt-2 text-sm text-brown-700/65">{selectedLocation} · {start} — {end}</p></div><AutoFilterForm className="flex flex-wrap items-end gap-2"><label className="text-xs font-medium">{tr(locale, "Week containing", "选择周次")}<input type="date" name="date" defaultValue={selectedDate} className="mt-1 block rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label><label className="text-xs font-medium">{tr(locale, "Studio", "门店")}<select name="location" defaultValue={locationId} className="mt-1 block min-w-64 rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label></AutoFilterForm></div>

    <div className="mt-7 grid gap-4 sm:grid-cols-3">{[[tr(locale, "Weekly income", "本周收入"), totals.income], [tr(locale, "Weekly expenses", "本周支出"), totals.expenses], [tr(locale, "Weekly net", "本周净额"), totals.net]].map(([label, value], index) => <div key={String(label)} className={`rounded-2xl border p-5 shadow-sm ${index === 2 ? "border-brown-900 bg-brown-900 text-cream-50" : "border-sand-200 bg-cream-50"}`}><p className="text-xs opacity-60">{label}</p><p className="mt-2 font-serif text-3xl">{money(Number(value))}</p></div>)}</div>

    <section className="mt-7 overflow-hidden rounded-3xl border border-sand-200 bg-cream-50 shadow-sm"><div className="px-5 py-4"><h2 className="font-serif text-2xl">{tr(locale, "Daily income and expenses", "每日收入与支出")}</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-sand-50 text-left text-xs text-brown-700/55"><tr><th className="px-5 py-3">{tr(locale, "Date", "日期")}</th><th className="text-right">{tr(locale, "Treatment receipts", "项目收款")}</th><th className="text-right">{tr(locale, "Voucher sales", "礼券售出")}</th><th className="text-right">{tr(locale, "Income", "收入")}</th><th className="text-right">{tr(locale, "Expenses", "支出")}</th><th className="pr-5 text-right">{tr(locale, "Net", "净额")}</th></tr></thead><tbody>{dailyFinance.map((day) => <tr key={day.date} className="border-t border-sand-100"><td className="px-5 py-3 font-medium">{dateFormat.format(new Date(`${day.date}T12:00:00Z`))}</td><td className="text-right">{money(day.treatmentReceipts)}</td><td className="text-right">{money(day.voucherReceipts)}</td><td className="text-right">{money(day.income)}</td><td className="text-right text-rose-700">{money(day.expenses)}</td><td className="pr-5 text-right font-semibold">{money(day.net)}</td></tr>)}</tbody></table></div></section>

    <section className="mt-7 overflow-hidden rounded-3xl border border-sand-200 bg-cream-50 shadow-sm"><div className="px-5 py-4"><h2 className="font-serif text-2xl">{tr(locale, "Therapist attendance & payroll", "按摩师出勤与工资")}</h2><p className="mt-1 text-xs text-brown-700/55">{tr(locale, "Pay estimate = massage minutes ÷ 60 × hourly rate.", "工资估算＝按摩分钟 ÷ 60 × 时薪。")}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-sm"><thead className="bg-sand-50 text-left text-xs text-brown-700/55"><tr><th className="px-5 py-3">{tr(locale, "Therapist", "按摩师")}</th><th>{tr(locale, "Attendance", "出勤")}</th>{days.map((day) => <th key={day} className="text-center">{dateFormat.format(new Date(`${day}T12:00:00Z`))}</th>)}<th className="text-right">{tr(locale, "Weekly minutes", "周分钟")}</th><th className="text-right">{tr(locale, "Requested", "指定分钟")}</th><th className="text-right">{tr(locale, "Hourly rate", "时薪")}</th><th className="pr-5 text-right">{tr(locale, "Estimated pay", "估算工资")}</th></tr></thead><tbody>{[...therapists.values()].sort((a,b) => a.display_name.localeCompare(b.display_name)).map((therapist) => { const therapistBookings = bookings.filter((booking) => booking.therapist_id === therapist.id); const total = therapistBookings.reduce((sum, booking) => sum + minutes(booking), 0); const requested = therapistBookings.filter((booking) => !booking.is_any_professional).reduce((sum, booking) => sum + minutes(booking), 0); const attendance = new Set(rosters.filter((roster) => roster.therapist_id === therapist.id).map((roster) => roster.date)).size; const rate = cents(therapist.pay_rate_cents_per_hour); return <tr key={therapist.id} className="border-t border-sand-100 align-middle"><td className="px-5 py-3 font-medium">{therapist.display_name}</td><td>{attendance} {tr(locale, "days", "天")}</td>{days.map((day) => { const daily = therapistBookings.filter((booking) => localDate(booking.start_at) === day); const dailyTotal = daily.reduce((sum, booking) => sum + minutes(booking), 0); const dailyRequested = daily.filter((booking) => !booking.is_any_professional).reduce((sum, booking) => sum + minutes(booking), 0); return <td key={day} className="text-center"><span className="font-medium">{dailyTotal}</span><span className="block text-[10px] text-gold-dark">{tr(locale, "requested", "指定")} {dailyRequested}</span></td>; })}<td className="text-right font-semibold">{total} min</td><td className="text-right font-semibold text-gold-dark">{requested} min</td><td className="py-2 text-right"><EnterSubmitForm action={saveTherapistPayRate} saveOnBlur className="ml-auto flex w-28 items-center gap-1"><input type="hidden" name="therapist_id" value={therapist.id} /><span>$</span><input name="hourly_rate" type="number" min="0" step="0.01" defaultValue={(rate / 100).toFixed(2)} className="w-20 rounded-lg border border-sand-200 bg-white px-2 py-1.5 text-right text-xs" /><SubmitButton pendingLabel="…" className="sr-only">{tr(locale, "Save", "保存")}</SubmitButton></EnterSubmitForm></td><td className="pr-5 text-right font-semibold">{money(Math.round(total * rate / 60))}</td></tr>; })}</tbody></table></div></section>
  </div>;
}
