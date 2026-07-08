import { getAdminLocale, tr } from "@/lib/admin-i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateCustomerBookingNote } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";

const TIME_ZONE = "Australia/Adelaide";

type Relation = { name?: string; display_name?: string; category?: string };
type BookingRow = {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string;
  card_amount_cents: number | null;
  insurance_amount_cents: number | null;
  cash_amount_cents: number | null;
  voucher_amount_cents: number | null;
  waived_amount_cents: number | null;
  therapists: Relation | Relation[] | null;
  locations: Relation | Relation[] | null;
  services: Relation | Relation[] | null;
};

type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string;
  bookings: BookingRow[];
};

function one(value: Relation | Relation[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function cents(value: number | null) {
  return value ?? 0;
}

function duration(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function paymentLabels(booking: BookingRow, locale: "en" | "zh") {
  const money = (amount: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount / 100);
  const methods = [
    [cents(booking.card_amount_cents), tr(locale, "Card", "刷卡")],
    [cents(booking.insurance_amount_cents), tr(locale, "HICAPS", "保险/HICAPS")],
    [cents(booking.cash_amount_cents), tr(locale, "Cash", "现金")],
    [cents(booking.voucher_amount_cents), tr(locale, "Voucher", "礼券")],
    [cents(booking.waived_amount_cents), tr(locale, "Waived", "减免")],
  ] as const;
  const active = methods.filter(([amount]) => amount > 0).map(([amount, label]) => `${label} ${money(amount)}`);
  return active.length ? active.join(" + ") : tr(locale, "Not recorded", "未记录");
}

function categoryLabel(category: string | undefined, locale: "en" | "zh") {
  const labels: Record<string, [string, string]> = {
    relaxation: ["Relaxation", "放松按摩"],
    "remedial-pregnancy": ["Remedial", "理疗按摩"],
    "foot-care": ["Foot care", "足疗"],
    "deep-recovery": ["Deep recovery", "深度恢复"],
    aromatherapy: ["Aromatherapy", "芳香疗法"],
    acupuncture: ["Acupuncture", "针灸"],
    "additional-services": ["Additional services", "其他项目"],
    "deluxe-customised": ["Deluxe customised", "尊享定制"],
  };
  const label = category ? labels[category] : undefined;
  return label ? label[locale === "zh" ? 1 : 0] : category || "—";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getAdminLocale();
  const { q = "" } = await searchParams;
  const search = q.trim().toLocaleLowerCase();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id,reference,customer_name,customer_phone,customer_email,start_at,end_at,status,notes,card_amount_cents,insurance_amount_cents,cash_amount_cents,voucher_amount_cents,waived_amount_cents,therapists(display_name),locations(name),services(name,category)")
    .order("start_at", { ascending: false });

  const grouped = new Map<string, Customer>();
  for (const row of (data ?? []) as unknown as BookingRow[]) {
    const key = row.customer_email?.trim().toLocaleLowerCase() || row.customer_phone.replace(/\s/g, "");
    const customer = grouped.get(key) ?? {
      key,
      name: row.customer_name,
      phone: row.customer_phone,
      email: row.customer_email,
      bookings: [],
    };
    customer.bookings.push(row);
    grouped.set(key, customer);
  }

  const customers = [...grouped.values()].filter((customer) => {
    if (!search) return true;
    return `${customer.name} ${customer.phone} ${customer.email}`.toLocaleLowerCase().includes(search);
  });

  const dateFormatter = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  });

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
        {tr(locale, "Customer records", "客户档案")}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-serif text-4xl text-brown-900">
            {tr(locale, "Customer management", "客户管理")}
          </h1>
          <p className="mt-2 text-sm text-brown-700/65">
            {tr(locale, "Review each customer's complete appointment history.", "查看每位客人的完整预约记录。")}
          </p>
        </div>
        <form className="flex w-full max-w-md gap-2" action="/admin/customers">
          <input
            name="q"
            defaultValue={q}
            placeholder={tr(locale, "Search name, phone or email", "搜索姓名、电话或邮箱")}
            className="min-w-0 flex-1 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm outline-none focus:border-gold-dark"
          />
          <button className="rounded-xl bg-brown-900 px-5 py-3 text-sm text-cream-50">
            {tr(locale, "Search", "搜索")}
          </button>
        </form>
      </div>

      {error ? (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error.message}</p>
      ) : null}

      <div className="mt-8 space-y-4">
        {customers.map((customer, index) => (
          <details key={customer.key} open={customers.length === 1 || (index === 0 && Boolean(search))} className="group overflow-hidden rounded-2xl border border-sand-200 bg-cream-50 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 marker:content-none sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="font-serif text-2xl text-brown-900">{customer.name}</h2>
                  <span className="rounded-full bg-sage-50 px-3 py-1 text-xs text-sage-800">
                    {customer.bookings.length} {tr(locale, "appointments", "次预约")}
                  </span>
                </div>
                <p className="mt-2 break-words text-sm text-brown-700/65">
                  {customer.phone}{customer.email ? ` · ${customer.email}` : ""}
                </p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-sand-200 text-xl text-gold-dark transition group-open:rotate-45">+</span>
            </summary>

            <div className="overflow-x-auto border-t border-sand-200">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-sand-50 text-left text-xs text-brown-700/55">
                  <tr>
                    <th className="px-5 py-3">{tr(locale, "Date", "日期")}</th>
                    <th>{tr(locale, "Studio", "门店")}</th>
                    <th>{tr(locale, "Treatment", "项目")}</th>
                    <th>{tr(locale, "Duration", "时长")}</th>
                    <th>{tr(locale, "Therapist", "按摩师")}</th>
                    <th>{tr(locale, "Payment", "付款方式")}</th>
                    <th>{tr(locale, "Notes", "备注")}</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.bookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-sand-100 align-top">
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="font-medium">{dateFormatter.format(new Date(booking.start_at))}</p>
                        <p className="mt-1 text-xs text-brown-700/45">{booking.reference}</p>
                      </td>
                      <td className="py-4 pr-4">{one(booking.locations)?.name || "—"}</td>
                      <td className="py-4 pr-4 font-medium">{categoryLabel(one(booking.services)?.category, locale)}</td>
                      <td className="whitespace-nowrap py-4 pr-4 font-medium">{duration(booking.start_at, booking.end_at)} min</td>
                      <td className="py-4 pr-4">{one(booking.therapists)?.display_name || "—"}</td>
                      <td className="py-4 pr-4">{paymentLabels(booking, locale)}</td>
                      <td className="w-72 py-3 pr-5">
                        <form action={updateCustomerBookingNote} className="flex gap-2">
                          <input type="hidden" name="booking_id" value={booking.id} />
                          <input name="notes" defaultValue={booking.notes} placeholder={tr(locale, "Add note", "输入备注")} maxLength={2000} className="min-w-0 flex-1 rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm outline-none focus:border-gold-dark" />
                          <SubmitButton pendingLabel="…" className="rounded-lg bg-brown-900 px-3 py-2 text-xs text-white">{tr(locale, "Save", "保存")}</SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        {!customers.length && !error ? (
          <div className="rounded-2xl border border-dashed border-sand-200 bg-cream-50 p-12 text-center text-brown-700/55">
            {tr(locale, "No matching customer records.", "没有找到匹配的客户记录。")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
