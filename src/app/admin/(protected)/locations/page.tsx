import { AutoFilterForm } from "@/components/admin/auto-filter-form";
import { getAdminLocale, tr } from "@/lib/admin-i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TIME_ZONE = "Australia/Adelaide";

type LocationRow = { id: string; name: string };
type BookingRow = {
  location_id: string;
  start_at: string;
  status: string;
  card_amount_cents: number | null;
  insurance_amount_cents: number | null;
  cash_amount_cents: number | null;
  voucher_amount_cents: number | null;
  waived_amount_cents: number | null;
};
type DailyRecordRow = {
  location_id: string;
  record_date: string;
  promotion_cents: number | null;
  other_income_cents: number | null;
  cash_expense_cents: number | null;
};
type VoucherSaleRow = {
  location_id: string;
  sale_date: string;
  face_value_cents: number | null;
  card_amount_cents: number | null;
  hicaps_amount_cents: number | null;
  cash_amount_cents: number | null;
};
type VoucherRedemptionRow = {
  location_id: string;
  used_date: string;
  amount_cents: number | null;
};

type SearchParams = Promise<{
  date?: string;
  location?: string | string[];
}>;

function cents(value: number | null | undefined) {
  return value ?? 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value / 100);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function weekStart(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return isoDate(date);
}

function localDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function selectedLocationIds(param: string | string[] | undefined, fallback: string[]) {
  const raw = Array.isArray(param) ? param : param ? [param] : [];
  const cleaned = raw.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function bookingPayment(booking: BookingRow) {
  return (
    cents(booking.card_amount_cents) +
    cents(booking.insurance_amount_cents) +
    cents(booking.cash_amount_cents) +
    cents(booking.voucher_amount_cents)
  );
}

function voucherPayment(voucher: VoucherSaleRow) {
  return (
    cents(voucher.card_amount_cents) +
    cents(voucher.hicaps_amount_cents) +
    cents(voucher.cash_amount_cents)
  );
}

function makeMetrics({
  locationId,
  dates,
  bookings,
  records,
  voucherSales,
  voucherRedemptions,
}: {
  locationId?: string;
  dates: string[];
  bookings: BookingRow[];
  records: DailyRecordRow[];
  voucherSales: VoucherSaleRow[];
  voucherRedemptions: VoucherRedemptionRow[];
}) {
  const dateSet = new Set(dates);
  const scopedBookings = bookings.filter((booking) => (!locationId || booking.location_id === locationId) && dateSet.has(localDate(booking.start_at)));
  const scopedRecords = records.filter((record) => (!locationId || record.location_id === locationId) && dateSet.has(record.record_date));
  const scopedVoucherSales = voucherSales.filter((voucher) => (!locationId || voucher.location_id === locationId) && dateSet.has(voucher.sale_date));
  const scopedVoucherRedemptions = voucherRedemptions.filter((voucher) => (!locationId || voucher.location_id === locationId) && dateSet.has(voucher.used_date));

  const treatmentRevenue = scopedBookings.reduce((sum, booking) => sum + bookingPayment(booking), 0);
  const voucherRevenue = scopedVoucherSales.reduce((sum, voucher) => sum + voucherPayment(voucher), 0);
  const voucherFaceValue = scopedVoucherSales.reduce((sum, voucher) => sum + cents(voucher.face_value_cents), 0);
  const voucherUsed = scopedVoucherRedemptions.reduce((sum, voucher) => sum + cents(voucher.amount_cents), 0);
  const expenses = scopedRecords.reduce((sum, record) => sum + cents(record.other_income_cents) + cents(record.cash_expense_cents), 0);
  const discounts = scopedRecords.reduce((sum, record) => sum + cents(record.promotion_cents), 0) + scopedBookings.reduce((sum, booking) => sum + cents(booking.waived_amount_cents), 0);
  const revenue = treatmentRevenue + voucherRevenue;

  return {
    treatmentRevenue,
    voucherRevenue,
    voucherFaceValue,
    voucherUsed,
    revenue,
    expenses,
    discounts,
    net: revenue - expenses - discounts,
    bookingCount: scopedBookings.length,
  };
}

export default async function LocationsPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getAdminLocale();
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : today;
  const start = weekStart(selectedDate);
  const end = addDays(start, 6);
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  const { data: locationRows } = await supabase
    .from("locations")
    .select("id,name")
    .eq("active", true)
    .order("name");
  const locations = (locationRows ?? []) as LocationRow[];
  const selectedIds = selectedLocationIds(params.location, locations.map((location) => location.id));
  const selectedSet = new Set(selectedIds);
  const selectedLocations = locations.filter((location) => selectedSet.has(location.id));

  const [bookingResult, dailyResult, voucherSaleResult, voucherRedemptionResult] =
    selectedIds.length
      ? await Promise.all([
          supabase
            .from("bookings")
            .select("location_id,start_at,status,card_amount_cents,insurance_amount_cents,cash_amount_cents,voucher_amount_cents,waived_amount_cents")
            .in("location_id", selectedIds)
            .gte("start_at", `${addDays(start, -1)}T00:00:00Z`)
            .lt("start_at", `${addDays(end, 2)}T00:00:00Z`),
          supabase
            .from("daily_store_records")
            .select("location_id,record_date,promotion_cents,other_income_cents,cash_expense_cents")
            .in("location_id", selectedIds)
            .gte("record_date", start)
            .lte("record_date", end),
          supabase
            .from("gift_voucher_sales")
            .select("location_id,sale_date,face_value_cents,card_amount_cents,hicaps_amount_cents,cash_amount_cents")
            .in("location_id", selectedIds)
            .gte("sale_date", start)
            .lte("sale_date", end),
          supabase
            .from("gift_voucher_redemptions")
            .select("location_id,used_date,amount_cents")
            .in("location_id", selectedIds)
            .gte("used_date", start)
            .lte("used_date", end),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const bookings = ((bookingResult.data ?? []) as BookingRow[]).filter((booking) => booking.status !== "cancelled" && booking.status !== "no_show");
  const dailyRecords = (dailyResult.data ?? []) as DailyRecordRow[];
  const voucherSales = (voucherSaleResult.data ?? []) as VoucherSaleRow[];
  const voucherRedemptions = (voucherRedemptionResult.data ?? []) as VoucherRedemptionRow[];

  const todayMetrics = makeMetrics({
    dates: [selectedDate],
    bookings,
    records: dailyRecords,
    voucherSales,
    voucherRedemptions,
  });
  const weekMetrics = makeMetrics({
    dates: weekDates,
    bookings,
    records: dailyRecords,
    voucherSales,
    voucherRedemptions,
  });

  const cards = [
    [tr(locale, "Today revenue", "今日营收"), todayMetrics.revenue, tr(locale, "Treatments + voucher sales", "项目收款 + 礼券售出")],
    [tr(locale, "This week revenue", "本周营收"), weekMetrics.revenue, `${start} — ${end}`],
    [tr(locale, "This week expenses", "本周支出"), weekMetrics.expenses, tr(locale, "Recorded store expenses", "已记录店铺支出")],
    [tr(locale, "Voucher sold", "礼券售出"), weekMetrics.voucherFaceValue, tr(locale, "Face value this week", "本周礼券面额")],
    [tr(locale, "Discounts / waived", "折扣 / 减免"), weekMetrics.discounts, tr(locale, "Promotions and waived amounts", "促销与减免金额")],
  ] as const;

  return (
    <div className="mx-auto max-w-[1500px]">
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
        {tr(locale, "Owner & area manager view", "老板与区域经理视图")}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-serif text-4xl text-brown-900">
            {tr(locale, "Store overview", "店铺总览")}
          </h1>
          <p className="mt-2 text-sm text-brown-700/65">
            {tr(locale, "Compare selected studios across today and the current week.", "多选店铺，查看今日与本周经营汇总。")}
          </p>
        </div>
        <AutoFilterForm className="flex flex-wrap items-end gap-3">
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="location" value={id} />
          ))}
          <label className="text-xs font-medium">
            {tr(locale, "Date", "日期")}
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="mt-1 block rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" className="rounded-xl bg-brown-900 px-5 py-2.5 text-sm font-medium text-cream-50">
            {tr(locale, "View", "查看")}
          </button>
        </AutoFilterForm>
      </div>

      <AutoFilterForm className="mt-7 rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm">
        <input type="hidden" name="date" value={selectedDate} />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-brown-900">
              {tr(locale, "Select stores", "选择店铺")}
            </h2>
            <p className="mt-1 text-xs text-brown-700/55">
              {tr(locale, "Choose one or more studios. Changing selection refreshes automatically.", "可选择一家或多家店铺，选择后自动刷新。")}
            </p>
          </div>
          <p className="rounded-full bg-sage-50 px-4 py-2 text-xs font-medium text-sage-700">
            {selectedLocations.length} / {locations.length}
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {locations.map((location) => (
            <label
              key={location.id}
              className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white/65 px-4 py-3 text-sm font-medium text-brown-800 transition-colors hover:bg-champagne-light/35"
            >
              <input
                type="checkbox"
                name="location"
                value={location.id}
                defaultChecked={selectedSet.has(location.id)}
                className="size-4 accent-sage-700"
              />
              <span>{location.name}</span>
            </label>
          ))}
        </div>
      </AutoFilterForm>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, caption], index) => (
          <div
            key={label}
            className={`rounded-3xl border p-5 shadow-sm ${
              index === 1
                ? "border-brown-900 bg-brown-900 text-cream-50"
                : "border-sand-200 bg-cream-50"
            }`}
          >
            <p className="text-xs opacity-60">{label}</p>
            <p className="mt-2 font-serif text-3xl">{money(value)}</p>
            <p className="mt-2 text-xs opacity-60">{caption}</p>
          </div>
        ))}
      </div>

      <section className="mt-7 overflow-hidden rounded-3xl border border-sand-200 bg-cream-50 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4">
          <div>
            <h2 className="font-serif text-2xl text-brown-900">
              {tr(locale, "Selected store summary", "所选店铺汇总")}
            </h2>
            <p className="mt-1 text-xs text-brown-700/55">
              {tr(locale, "Bottom summary for the selected stores.", "底部显示所选店铺的汇总。")}
            </p>
          </div>
          <p className="text-xs text-brown-700/55">
            {selectedDate} · {start} — {end}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-sand-50 text-left text-xs text-brown-700/55">
              <tr>
                <th className="px-5 py-3">{tr(locale, "Store", "店铺")}</th>
                <th className="text-right">{tr(locale, "Today revenue", "今日营收")}</th>
                <th className="text-right">{tr(locale, "Week revenue", "本周营收")}</th>
                <th className="text-right">{tr(locale, "Expenses", "支出")}</th>
                <th className="text-right">{tr(locale, "Voucher sold", "礼券售出")}</th>
                <th className="text-right">{tr(locale, "Voucher used", "礼券使用")}</th>
                <th className="text-right">{tr(locale, "Discounts", "折扣")}</th>
                <th className="pr-5 text-right">{tr(locale, "Net", "净额")}</th>
              </tr>
            </thead>
            <tbody>
              {selectedLocations.map((location) => {
                const todayStore = makeMetrics({
                  locationId: location.id,
                  dates: [selectedDate],
                  bookings,
                  records: dailyRecords,
                  voucherSales,
                  voucherRedemptions,
                });
                const weekStore = makeMetrics({
                  locationId: location.id,
                  dates: weekDates,
                  bookings,
                  records: dailyRecords,
                  voucherSales,
                  voucherRedemptions,
                });
                return (
                  <tr key={location.id} className="border-t border-sand-100">
                    <td className="px-5 py-4 font-medium text-brown-900">
                      {location.name}
                      <span className="mt-1 block text-xs font-normal text-brown-700/45">
                        {weekStore.bookingCount} {tr(locale, "bookings", "个预约")}
                      </span>
                    </td>
                    <td className="text-right">{money(todayStore.revenue)}</td>
                    <td className="text-right font-semibold">{money(weekStore.revenue)}</td>
                    <td className="text-right text-rose-700">{money(weekStore.expenses)}</td>
                    <td className="text-right">{money(weekStore.voucherFaceValue)}</td>
                    <td className="text-right">{money(weekStore.voucherUsed)}</td>
                    <td className="text-right text-gold-dark">{money(weekStore.discounts)}</td>
                    <td className="pr-5 text-right font-semibold">{money(weekStore.net)}</td>
                  </tr>
                );
              })}
              <tr className="border-t border-brown-900/10 bg-brown-900 text-cream-50">
                <td className="px-5 py-4 font-semibold">{tr(locale, "Total selected", "所选合计")}</td>
                <td className="text-right">{money(todayMetrics.revenue)}</td>
                <td className="text-right font-semibold">{money(weekMetrics.revenue)}</td>
                <td className="text-right">{money(weekMetrics.expenses)}</td>
                <td className="text-right">{money(weekMetrics.voucherFaceValue)}</td>
                <td className="text-right">{money(weekMetrics.voucherUsed)}</td>
                <td className="text-right">{money(weekMetrics.discounts)}</td>
                <td className="pr-5 text-right font-semibold">{money(weekMetrics.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
