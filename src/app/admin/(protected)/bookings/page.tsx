import { BookingCalendar, type CalendarBooking, type CalendarStatus, type CalendarTherapist } from "@/components/admin/booking-calendar";
import { cancelBookingCalendar, createAdminBooking, removeGiftVoucherSale, saveDailyStoreRecord, saveGiftVoucherSale, updateBookingCalendar } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { AutoFilterForm } from "@/components/admin/auto-filter-form";
import { EnterSubmitForm } from "@/components/admin/enter-submit-form";
import { getAdminLocale, tr } from "@/lib/admin-i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TIME_ZONE = "Australia/Adelaide";

type TherapistRelation = { id: string; display_name: string };
type ServiceRelation = { id?: string; name?: string; category?: string; duration_minutes?: number; price_cents?: number };
type BookingRow = {
  id: string; reference: string; customer_name: string; customer_phone: string; start_at: string; end_at: string;
  status: string; calendar_status: CalendarStatus | null; is_any_professional: boolean; therapist_id: string;
  card_amount_cents: number | null; insurance_amount_cents: number | null; cash_amount_cents: number | null;
  voucher_amount_cents: number | null; waived_amount_cents: number | null; voucher_number: string;
  services: ServiceRelation | ServiceRelation[] | null;
};
type DailyRecord = { opening_cash_cents: number; promotion_cents: number; other_income_cents: number; cash_expense_cents: number; notes: string };
type VoucherSale = { id: string; voucher_number: string; face_value_cents: number; card_amount_cents: number; hicaps_amount_cents: number; cash_amount_cents: number; voucher_amount_cents: number; waived_amount_cents: number; notes: string };

function relationOne<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }
function localDate(value: string) { return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); }
function shiftDate(date: string, days: number) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
function minutesFromTime(value: string) { return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5)); }
function cents(value: number | null | undefined) { return value ?? 0; }
function dollars(value: number) { return (value / 100).toFixed(2); }
function formatMoney(value: number) { return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value / 100); }
function parseDailyNotes(value: string) {
  const lines = value.split(/\r?\n/);
  const tagged = (tag: string) => lines.find((line) => line.startsWith(tag))?.slice(tag.length) ?? "";
  return {
    otherExpenseItem: tagged("[OTHER_EXPENSE_ITEM]"),
    cashExpenseItem: tagged("[CASH_EXPENSE_ITEM]"),
    notes: lines.filter((line) => !line.startsWith("[OTHER_EXPENSE_ITEM]") && !line.startsWith("[CASH_EXPENSE_ITEM]")).join("\n").trim(),
  };
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ date?: string; location?: string }> }) {
  const params = await searchParams;
  const locale = await getAdminLocale();
  const supabase = await createSupabaseServerClient();
  const date = params.date || new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
  const { data: locationRows } = await supabase.from("locations").select("id,name").eq("active", true).order("name");
  const locations = locationRows ?? [];
  const locationId = params.location || locations[0]?.id || "";
  const [rostersResult, bookingsResult, dailyResult, vouchersResult, servicesResult] = await Promise.all([
    supabase.from("daily_rosters").select("id,therapist_id,start_time,end_time,therapists(id,display_name)").eq("date", date).eq("location_id", locationId).eq("active", true).order("start_time"),
    supabase.from("bookings").select("id,reference,customer_name,customer_phone,start_at,end_at,status,calendar_status,is_any_professional,therapist_id,card_amount_cents,insurance_amount_cents,cash_amount_cents,voucher_amount_cents,waived_amount_cents,voucher_number,services(name,category,price_cents)").eq("location_id", locationId).neq("status", "cancelled").gte("start_at", `${shiftDate(date, -1)}T00:00:00Z`).lt("start_at", `${shiftDate(date, 1)}T23:59:59Z`).order("start_at"),
    supabase.from("daily_store_records").select("opening_cash_cents,promotion_cents,other_income_cents,cash_expense_cents,notes").eq("location_id", locationId).eq("record_date", date).maybeSingle(),
    supabase.from("gift_voucher_sales").select("id,voucher_number,face_value_cents,card_amount_cents,hicaps_amount_cents,cash_amount_cents,voucher_amount_cents,waived_amount_cents,notes").eq("location_id", locationId).eq("sale_date", date).order("created_at"),
    supabase.from("services").select("id,name,category,duration_minutes,price_cents").eq("active", true).order("category").order("duration_minutes"),
  ]);
  const rosterRows = rostersResult.data ?? [];
  const rawBookings = ((bookingsResult.data ?? []) as unknown as BookingRow[]).filter((booking) => localDate(booking.start_at) === date);
  const daily = (dailyResult.data as DailyRecord | null) ?? { opening_cash_cents: 0, promotion_cents: 0, other_income_cents: 0, cash_expense_cents: 0, notes: "" };
  const dailyNotes = parseDailyNotes(daily.notes);
  const vouchers = (vouchersResult.data ?? []) as VoucherSale[];
  const services = (servicesResult.data ?? []) as ServiceRelation[];

  const therapistMap = new Map<string, CalendarTherapist>();
  for (const roster of rosterRows) {
    const therapist = relationOne(roster.therapists as unknown as TherapistRelation | TherapistRelation[] | null);
    if (therapist) therapistMap.set(therapist.id, { id: therapist.id, displayName: therapist.display_name, rosterId: String(roster.id), startTime: String(roster.start_time).slice(0, 5), endTime: String(roster.end_time).slice(0, 5) });
  }
  const therapists = [...therapistMap.values()];
  const bookings = rawBookings.map((booking): CalendarBooking => {
    const service = relationOne(booking.services);
    return {
      id: booking.id, reference: booking.reference, customerName: booking.customer_name, customerPhone: booking.customer_phone,
      serviceName: service?.name || tr(locale, "Treatment", "服务项目"), therapistId: booking.therapist_id,
      servicePrice: cents(service?.price_cents) / 100,
      startAt: booking.start_at, endAt: booking.end_at,
      calendarStatus: booking.calendar_status ?? (booking.status === "no_show" ? "no_show" : "unpaid"),
      isAnyProfessional: booking.is_any_professional,
      paymentAmounts: { card: cents(booking.card_amount_cents) / 100, insurance: cents(booking.insurance_amount_cents) / 100, cash: cents(booking.cash_amount_cents) / 100, voucher: cents(booking.voucher_amount_cents) / 100, waived: cents(booking.waived_amount_cents) / 100 },
      voucherNumber: booking.voucher_number,
    };
  });

  const rosterStarts = rosterRows.map((roster) => minutesFromTime(String(roster.start_time)));
  const rosterEnds = rosterRows.map((roster) => minutesFromTime(String(roster.end_time)));
  const startMinute = Math.floor(Math.min(...rosterStarts, 540) / 30) * 30;
  const endMinute = Math.ceil(Math.max(...rosterEnds, 1080) / 30) * 30;
  const selectedLocation = locations.find((location) => location.id === locationId)?.name;

  const bookingPayment = rawBookings.reduce((sum, booking) => ({
    card: sum.card + cents(booking.card_amount_cents), hicaps: sum.hicaps + cents(booking.insurance_amount_cents), cash: sum.cash + cents(booking.cash_amount_cents),
    voucher: sum.voucher + cents(booking.voucher_amount_cents), waived: sum.waived + cents(booking.waived_amount_cents),
  }), { card: 0, hicaps: 0, cash: 0, voucher: 0, waived: 0 });
  const voucherPayment = vouchers.reduce((sum, voucher) => ({
    card: sum.card + voucher.card_amount_cents, hicaps: sum.hicaps + voucher.hicaps_amount_cents, cash: sum.cash + voucher.cash_amount_cents,
    voucher: sum.voucher + voucher.voucher_amount_cents, waived: sum.waived + voucher.waived_amount_cents,
  }), { card: 0, hicaps: 0, cash: 0, voucher: 0, waived: 0 });
  const projectSales = rawBookings.reduce((sum, booking) => sum + cents(relationOne(booking.services)?.price_cents), 0);
  const voucherSales = vouchers.reduce((sum, voucher) => sum + voucher.face_value_cents, 0);
  const registeredIncome = Object.values(bookingPayment).reduce((a, b) => a + b, 0) + Object.values(voucherPayment).reduce((a, b) => a + b, 0);
  const expectedClosingCash = daily.opening_cash_cents + bookingPayment.cash + voucherPayment.cash - daily.other_income_cents - daily.promotion_cents - daily.cash_expense_cents;
  const duration = { relaxation: 0, regular: 0, foot: 0, booked: 0 };
  for (const booking of rawBookings) {
    const mins = Math.max(0, Math.round((new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / 60000));
    const category = `${relationOne(booking.services)?.category ?? ""} ${relationOne(booking.services)?.name ?? ""}`.toLowerCase();
    if (category.includes("foot")) duration.foot += mins;
    else if (category.includes("relax")) duration.relaxation += mins;
    else duration.regular += mins;
    duration.booked += mins;
  }

  return <div>
    <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Bookings", "预约管理")}</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-4xl text-brown-900">{tr(locale, "Daily appointment calendar", "每日预约日历")}</h1><p className="mt-1 text-sm text-brown-700/65">{selectedLocation} · {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-AU", { dateStyle: "full", timeZone: TIME_ZONE }).format(new Date(`${date}T12:00:00Z`))}</p></div><p className="max-w-xl text-sm text-brown-700/65">{tr(locale, "Appointments, payments and daily reconciliation follow the store workbook in one place.", "预约、收款与每日对账按照门店工作簿集中在同一页面。")}</p></div>

    <AutoFilterForm className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-sand-200 bg-cream-50 p-4">
      <label className="text-xs font-medium text-brown-700">{tr(locale, "Date", "日期")}<input type="date" name="date" defaultValue={date} className="mt-1 block rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
      <label className="min-w-60 flex-1 text-xs font-medium text-brown-700">{tr(locale, "Studio", "门店")}<select name="location" defaultValue={locationId} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      <SubmitButton pendingLabel={tr(locale, "Loading…", "正在加载…")} className="self-end rounded-full bg-brown-900 px-5 py-2.5 text-sm text-cream-50">{tr(locale, "View day", "查看当日")}</SubmitButton>
    </AutoFilterForm>

    <section className="mt-5 rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "New appointment", "新增预约")}</p>
          <h2 className="mt-1 font-serif text-2xl text-brown-900">{tr(locale, "Add a booking", "添加客户预约")}</h2>
        </div>
        <p className="text-xs text-brown-700/55">{tr(locale, "Uses the same roster and double-booking checks.", "使用同一套排班和防撞单规则。")}</p>
      </div>
      <form action={createAdminBooking} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input type="hidden" name="location_id" value={locationId} />
        <input type="hidden" name="date" value={date} />
        <label className="text-xs font-medium text-brown-700">{tr(locale, "Customer name", "客户姓名")}<input required name="customer_name" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="text-xs font-medium text-brown-700">{tr(locale, "Phone", "电话")}<input required name="customer_phone" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="text-xs font-medium text-brown-700">{tr(locale, "Email optional", "邮箱（可选）")}<input type="email" name="customer_email" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="text-xs font-medium text-brown-700">{tr(locale, "Start time", "开始时间")}<input required type="time" step={900} name="start_time" defaultValue="09:00" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="text-xs font-medium text-brown-700">{tr(locale, "Therapist", "按摩师")}<select name="therapist_id" defaultValue="any" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"><option value="any">{tr(locale, "Any professional", "任意按摩师")}</option>{therapists.map((therapist) => <option key={therapist.id} value={therapist.id}>{therapist.displayName}</option>)}</select></label>
        <label className="text-xs font-medium text-brown-700">{tr(locale, "Treatment", "项目")}<select required name="service_id" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"><option value="">{tr(locale, "Select treatment", "选择项目")}</option>{services.map((service) => <option key={service.id} value={service.id}>{service.category} · {service.name} · {service.duration_minutes} min · {formatMoney(cents(service.price_cents))}</option>)}</select></label>
        <label className="text-xs font-medium text-brown-700 md:col-span-2 xl:col-span-5">{tr(locale, "Notes", "备注")}<input name="notes" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <SubmitButton pendingLabel={tr(locale, "Adding…", "添加中…")} className="self-end rounded-xl bg-brown-900 px-5 py-2.5 text-sm text-cream-50">{tr(locale, "Add booking", "添加预约")}</SubmitButton>
      </form>
    </section>

    {therapists.length ? <div className="mt-6"><BookingCalendar therapists={therapists} initialBookings={bookings} startMinute={startMinute} endMinute={endMinute} locale={locale} updateAction={updateBookingCalendar} cancelAction={cancelBookingCalendar} /></div> : <div className="mt-6 rounded-2xl border border-dashed border-sand-200 bg-cream-50 p-10 text-center"><p className="font-serif text-2xl">{tr(locale, "No therapists rostered", "当天没有按摩师排班")}</p><p className="mt-2 text-sm text-brown-700/60">{tr(locale, "Add therapists to the daily roster to build this calendar.", "请先在每日排班中添加按摩师，日历才会显示对应列。")}</p></div>}

    <section className="mt-8 rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Record", "经营记录")}</p><h2 className="mt-1 font-serif text-3xl">{tr(locale, "Daily operating summary", "每日经营汇总")}</h2></div><p className="text-xs text-brown-700/55">{tr(locale, "Calculated from active appointments and voucher sales", "根据有效预约和礼券销售自动计算")}</p></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[[tr(locale, "Treatment sales", "项目销售额"), projectSales], [tr(locale, "Voucher sales", "礼券销售额"), voucherSales], [tr(locale, "Registered receipts", "已登记收款"), registeredIncome], [tr(locale, "Customers", "客人数"), rawBookings.length, true], [tr(locale, "Expected closing cash", "预计收盘现金"), expectedClosingCash]].map(([label, value, count]) => <div key={String(label)} className="rounded-2xl border border-sand-100 bg-white p-4"><p className="text-xs text-brown-700/55">{label}</p><p className="mt-1 font-serif text-2xl">{count ? value : formatMoney(Number(value))}</p></div>)}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="overflow-hidden rounded-2xl border border-sand-200"><table className="w-full text-sm"><thead className="bg-sand-50 text-left text-xs text-brown-700/60"><tr><th className="px-4 py-3">{tr(locale, "Payment", "收款方式")}</th><th className="px-4 py-3 text-right">{tr(locale, "Treatments", "预约项目")}</th><th className="px-4 py-3 text-right">{tr(locale, "Vouchers", "礼券销售")}</th><th className="px-4 py-3 text-right">{tr(locale, "Total", "合计")}</th></tr></thead><tbody>{(["card", "hicaps", "cash", "voucher", "waived"] as const).map((key) => <tr key={key} className="border-t border-sand-100"><td className="px-4 py-3">{{ card: tr(locale, "Card", "刷卡"), hicaps: "HICAPS", cash: tr(locale, "Cash", "现金"), voucher: tr(locale, "Gift voucher", "礼券"), waived: tr(locale, "Free / waived", "免费 / 减免") }[key]}</td><td className="px-4 py-3 text-right">{formatMoney(bookingPayment[key])}</td><td className="px-4 py-3 text-right">{formatMoney(voucherPayment[key])}</td><td className="px-4 py-3 text-right font-medium">{formatMoney(bookingPayment[key] + voucherPayment[key])}</td></tr>)}</tbody></table></div>
        <div className="rounded-2xl border border-sand-200 p-4"><h3 className="font-serif text-xl">{tr(locale, "Treatment duration", "项目时长")}</h3><div className="mt-4 grid grid-cols-2 gap-3">{[[tr(locale, "Relaxation massage", "放松按摩"), duration.relaxation], [tr(locale, "Other treatments", "其他项目"), duration.regular], [tr(locale, "Foot care", "足疗"), duration.foot], [tr(locale, "Booked total", "预约总时长"), duration.booked]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-sand-50 p-3"><p className="text-xs text-brown-700/55">{label}</p><p className="mt-1 text-lg font-semibold">{value} min</p></div>)}</div></div>
      </div>
      <EnterSubmitForm action={saveDailyStoreRecord} saveOnBlur className="mt-5 grid gap-4 rounded-2xl border border-sand-200 bg-sand-50/50 p-4 md:grid-cols-2 xl:grid-cols-6">
        <input type="hidden" name="location_id" value={locationId} /><input type="hidden" name="record_date" value={date} />
        <label className="text-xs font-medium text-brown-700">{tr(locale, "Opening cash", "开盘现金")}<input type="number" min="0" step="0.01" name="opening_cash" defaultValue={dollars(daily.opening_cash_cents)} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="text-xs font-medium text-brown-700">{tr(locale, "Promotion / discount", "促销 / 折扣")}<input type="number" min="0" step="0.01" name="promotion" defaultValue={dollars(daily.promotion_cents)} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <fieldset className="grid grid-cols-2 gap-2 xl:col-span-2"><legend className="mb-1 text-xs font-medium text-brown-700">{tr(locale, "Other expense", "其他支出")}</legend><input aria-label={tr(locale, "Other expense amount", "其他支出金额")} type="number" min="0" step="0.01" name="other_expense" defaultValue={dollars(daily.other_income_cents)} className="block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /><input aria-label={tr(locale, "Other expense item", "其他支出项目")} name="other_expense_item" defaultValue={dailyNotes.otherExpenseItem} placeholder={tr(locale, "Expense item", "支出项目")} className="block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></fieldset>
        <fieldset className="grid grid-cols-2 gap-2 xl:col-span-2"><legend className="mb-1 text-xs font-medium text-brown-700">{tr(locale, "Cash expense", "现金支出")}</legend><input aria-label={tr(locale, "Cash expense amount", "现金支出金额")} type="number" min="0" step="0.01" name="cash_expense" defaultValue={dollars(daily.cash_expense_cents)} className="block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /><input aria-label={tr(locale, "Cash expense item", "现金支出项目")} name="cash_expense_item" defaultValue={dailyNotes.cashExpenseItem} placeholder={tr(locale, "Expense item", "支出项目")} className="block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></fieldset>
        <label className="text-xs font-medium text-brown-700 md:col-span-2 xl:col-span-5">{tr(locale, "Notes", "备注")}<textarea name="notes" defaultValue={dailyNotes.notes} rows={2} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <SubmitButton pendingLabel={tr(locale, "Saving…", "保存中…")} className="self-end rounded-xl bg-brown-900 px-5 py-2.5 text-sm text-white">{tr(locale, "Save daily record", "保存经营记录")}</SubmitButton>
      </EnterSubmitForm>
    </section>

    {false ? <section className="mt-8 rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm md:p-7">
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Gift vouchers", "礼券")}</p><h2 className="mt-1 font-serif text-3xl">{tr(locale, "Voucher sales register", "礼券销售记录")}</h2>
      <div className="mt-5 overflow-hidden rounded-2xl border border-sand-200">
        <div className="flex items-center justify-between bg-sand-50 px-4 py-3"><h3 className="font-serif text-xl">{tr(locale, "Voucher usage", "礼券使用记录")}</h3><span className="text-xs text-brown-700/55">{tr(locale, "Used in appointment payments", "预约结算中使用")}</span></div>
        <table className="w-full text-sm"><thead className="text-left text-xs text-brown-700/55"><tr><th className="px-4 py-3">{tr(locale, "Voucher number", "礼券编号")}</th><th className="px-4 py-3">{tr(locale, "Customer", "客户")}</th><th className="px-4 py-3">{tr(locale, "Booking reference", "预约编号")}</th><th className="px-4 py-3 text-right">{tr(locale, "Amount used", "使用金额")}</th></tr></thead><tbody>{rawBookings.filter((booking) => cents(booking.voucher_amount_cents) > 0).length ? rawBookings.filter((booking) => cents(booking.voucher_amount_cents) > 0).map((booking) => <tr key={booking.id} className="border-t border-sand-100"><td className="px-4 py-3 font-medium">{booking.voucher_number || tr(locale, "Number not recorded", "未登记编号")}</td><td className="px-4 py-3">{booking.customer_name}</td><td className="px-4 py-3 text-brown-700/60">{booking.reference}</td><td className="px-4 py-3 text-right font-medium">{formatMoney(cents(booking.voucher_amount_cents))}</td></tr>) : <tr><td colSpan={4} className="px-4 py-8 text-center text-brown-700/45">{tr(locale, "No vouchers used today", "当天没有礼券使用记录")}</td></tr>}</tbody></table>
      </div>
      <h3 className="mt-6 font-serif text-xl">{tr(locale, "New voucher sales", "新礼券销售")}</h3>
      <form action={saveGiftVoucherSale} className="mt-5 grid gap-3 rounded-2xl bg-sand-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <input type="hidden" name="location_id" value={locationId} /><input type="hidden" name="sale_date" value={date} />
        <label className="text-xs font-medium">{tr(locale, "Voucher number", "礼券编号")}<input required name="voucher_number" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="text-xs font-medium">{tr(locale, "Face value", "礼券金额")}<input required type="number" min="0.01" step="0.01" name="face_value" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        {[["card_amount", tr(locale, "Card", "刷卡")], ["hicaps_amount", "HICAPS"], ["cash_amount", tr(locale, "Cash", "现金")], ["voucher_amount", tr(locale, "Gift voucher", "礼券")], ["waived_amount", tr(locale, "Free / waived", "免费 / 减免")]].map(([name, label]) => <label key={name} className="text-xs font-medium">{label}<input type="number" min="0" step="0.01" name={name} defaultValue="0.00" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>)}
        <label className="text-xs font-medium">{tr(locale, "Notes", "备注")}<input name="voucher_notes" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label>
        <SubmitButton pendingLabel={tr(locale, "Adding…", "添加中…")} className="self-end rounded-xl bg-brown-900 px-5 py-2.5 text-sm text-white">{tr(locale, "Add voucher sale", "添加礼券销售")}</SubmitButton>
      </form>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="text-left text-xs text-brown-700/55"><tr><th className="py-3">{tr(locale, "Number", "编号")}</th><th className="text-right">{tr(locale, "Value", "金额")}</th><th className="text-right">{tr(locale, "Card", "刷卡")}</th><th className="text-right">HICAPS</th><th className="text-right">{tr(locale, "Cash", "现金")}</th><th className="text-right">{tr(locale, "Voucher", "礼券")}</th><th className="text-right">{tr(locale, "Free", "免费")}</th><th /></tr></thead><tbody>{vouchers.length ? vouchers.map((voucher) => <tr key={voucher.id} className="border-t border-sand-100"><td className="py-3 font-medium">{voucher.voucher_number}<span className="ml-2 text-xs font-normal text-brown-700/45">{voucher.notes}</span></td><td className="text-right">{formatMoney(voucher.face_value_cents)}</td><td className="text-right">{formatMoney(voucher.card_amount_cents)}</td><td className="text-right">{formatMoney(voucher.hicaps_amount_cents)}</td><td className="text-right">{formatMoney(voucher.cash_amount_cents)}</td><td className="text-right">{formatMoney(voucher.voucher_amount_cents)}</td><td className="text-right">{formatMoney(voucher.waived_amount_cents)}</td><td className="pl-3 text-right"><form action={removeGiftVoucherSale}><input type="hidden" name="id" value={voucher.id} /><SubmitButton pendingLabel={tr(locale, "Removing…", "删除中…")} className="text-xs text-rose-700">{tr(locale, "Remove", "删除")}</SubmitButton></form></td></tr>) : <tr><td colSpan={8} className="py-8 text-center text-brown-700/45">{tr(locale, "No voucher sales recorded", "当天没有礼券销售记录")}</td></tr>}</tbody></table></div>
    </section> : null}
  </div>;
}
