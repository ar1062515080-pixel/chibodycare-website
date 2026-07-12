import { removeGiftVoucherRedemption, saveGiftVoucherSale } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { VoucherRedemptionForm } from "@/components/admin/voucher-redemption-form";
import { getAdminLocale, tr } from "@/lib/admin-i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TIME_ZONE = "Australia/Adelaide";
type Sale = { id: string; location_id: string; sale_date: string; voucher_number: string; face_value_cents: number; card_amount_cents: number; hicaps_amount_cents: number; cash_amount_cents: number; voucher_amount_cents: number; waived_amount_cents: number; locations: { name: string } | Array<{ name: string }> | null };
type Redemption = { id: string; gift_voucher_sale_id: string; location_id: string; amount_cents: number; used_date: string; created_at: string; locations: { name: string } | Array<{ name: string }> | null };

function relationOne<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }
function money(cents: number) { return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100); }

export default async function VouchersPage({ searchParams }: { searchParams: Promise<{ location?: string; date?: string }> }) {
  const params = await searchParams;
  const locale = await getAdminLocale();
  const supabase = await createSupabaseServerClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
  const { data: locationsData } = await supabase.from("locations").select("id,name").eq("active", true).order("name");
  const locations = locationsData ?? [];
  const locationId = params.location || locations[0]?.id || "";
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") && (params.date ?? "") <= today ? params.date! : today;
  const [{ data: salesData }, { data: redemptionData }] = await Promise.all([
    supabase.from("gift_voucher_sales").select("id,location_id,sale_date,voucher_number,face_value_cents,card_amount_cents,hicaps_amount_cents,cash_amount_cents,voucher_amount_cents,waived_amount_cents,locations(name)").order("created_at", { ascending: false }),
    supabase.from("gift_voucher_redemptions").select("id,gift_voucher_sale_id,location_id,amount_cents,used_date,created_at,locations(name)").order("created_at", { ascending: false }),
  ]);
  const sales = (salesData ?? []) as unknown as Sale[];
  const redemptions = (redemptionData ?? []) as unknown as Redemption[];
  const usedBySale = new Map<string, number>();
  for (const row of redemptions) usedBySale.set(row.gift_voucher_sale_id, (usedBySale.get(row.gift_voucher_sale_id) ?? 0) + row.amount_cents);
  const saleById = new Map(sales.map((sale) => [sale.id, sale]));
  const visibleSales = sales.filter((sale) => sale.location_id === locationId && sale.sale_date === selectedDate);
  const visibleRedemptions = redemptions.filter((row) => row.location_id === locationId && row.used_date === selectedDate);

  return <div>
    <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Gift vouchers", "礼券管理")}</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-4xl text-brown-900">{tr(locale, "Voucher sales / use", "礼券售卖/使用")}</h1><p className="mt-2 text-sm text-brown-700/60">{tr(locale, "Sell, redeem and trace every voucher from one ledger.", "在同一台账中完成礼券售卖、使用及历史追踪。")}</p></div><form className="flex flex-wrap items-end gap-2"><label className="text-xs font-medium">{tr(locale, "Date", "日期")}<input type="date" name="date" defaultValue={selectedDate} max={today} className="mt-1 block rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm" /></label><label className="text-xs font-medium">{tr(locale, "Studio", "门店")}<select name="location" defaultValue={locationId} className="mt-1 block min-w-64 rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><SubmitButton pendingLabel={tr(locale, "Loading…", "加载中…")} className="rounded-xl bg-brown-900 px-4 py-2.5 text-sm text-white">{tr(locale, "View", "查看")}</SubmitButton></form></div>

    <div className="mt-7 grid gap-5 xl:grid-cols-2">
      <section className="rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-gold-dark">01 · {tr(locale, "Sell", "售出")}</p><h2 className="mt-1 font-serif text-2xl">{tr(locale, "Sell a gift voucher", "礼券售出")}</h2></div><span className="rounded-full bg-sage-100 px-3 py-1 text-xs text-sage-800">{selectedDate}</span></div>
        <form action={saveGiftVoucherSale} className="mt-5 space-y-4">
          <input type="hidden" name="location_id" value={locationId} /><input type="hidden" name="sale_date" value={selectedDate} />
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-medium">{tr(locale, "Voucher number", "礼券编号")}<input required name="voucher_number" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm" /></label><label className="text-xs font-medium">{tr(locale, "Voucher value", "礼券金额")}<input required type="number" min="0.01" step="0.01" name="face_value" className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm" /></label></div>
          <div><p className="text-xs font-medium text-brown-700">{tr(locale, "Payment method", "付款方式")}</p><div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">{[["card_amount", tr(locale, "Card", "刷卡")], ["hicaps_amount", "HICAPS"], ["cash_amount", tr(locale, "Cash", "现金")], ["voucher_amount", tr(locale, "Voucher", "礼券")], ["waived_amount", tr(locale, "Free", "免费")]].map(([name, label]) => <label key={name} className="text-[11px] text-brown-700/65">{label}<input type="number" min="0" step="0.01" name={name} defaultValue="0.00" className="mt-1 block w-full rounded-lg border border-sand-200 bg-white px-2 py-2 text-sm" /></label>)}</div></div>
          <SubmitButton pendingLabel={tr(locale, "Saving…", "保存中…")} className="w-full rounded-xl bg-brown-900 px-5 py-3 text-sm text-white">{tr(locale, "Record voucher sale", "记录礼券售出")}</SubmitButton>
        </form>
      </section>

      <section className="rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-gold-dark">02 · {tr(locale, "Redeem", "使用")}</p><h2 className="mt-1 font-serif text-2xl">{tr(locale, "Use a gift voucher", "礼券使用")}</h2></div><span className="rounded-full bg-gold/10 px-3 py-1 text-xs text-gold-dark">{selectedDate}</span></div>
        <VoucherRedemptionForm locationId={locationId} usedDate={selectedDate} locale={locale} vouchers={sales.map((sale) => ({ voucherNumber: sale.voucher_number, balanceCents: sale.face_value_cents - (usedBySale.get(sale.id) ?? 0) }))} />
      </section>
    </div>

    <section className="mt-6 overflow-hidden rounded-3xl border border-sand-200 bg-cream-50 shadow-sm">
      <div className="border-b border-sand-200 px-6 py-5"><h2 className="font-serif text-2xl">{tr(locale, "Voucher balances", "礼券余额及购买记录")}</h2></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-sand-50 text-left text-xs text-brown-700/55"><tr><th className="px-5 py-3">{tr(locale, "Number", "编号")}</th><th>{tr(locale, "Sold at", "售出门店")}</th><th>{tr(locale, "Purchase date", "购买日期")}</th><th className="text-right">{tr(locale, "Value", "金额")}</th><th className="text-right">{tr(locale, "Used", "已使用")}</th><th className="pr-5 text-right">{tr(locale, "Balance", "余额")}</th></tr></thead><tbody>{visibleSales.length ? visibleSales.map((sale) => { const used = usedBySale.get(sale.id) ?? 0; return <tr key={sale.id} className="border-t border-sand-100"><td className="px-5 py-3 font-medium">{sale.voucher_number}</td><td>{relationOne(sale.locations)?.name}</td><td>{sale.sale_date}</td><td className="text-right">{money(sale.face_value_cents)}</td><td className="text-right">{money(used)}</td><td className="pr-5 text-right font-semibold">{money(sale.face_value_cents - used)}</td></tr>; }) : <tr><td colSpan={6} className="py-10 text-center text-brown-700/45">{tr(locale, "No vouchers sold on this date", "所选日期没有礼券售出记录")}</td></tr>}</tbody></table></div>
    </section>

    <section className="mt-6 overflow-hidden rounded-3xl border border-sand-200 bg-cream-50 shadow-sm">
      <div className="border-b border-sand-200 px-6 py-5"><h2 className="font-serif text-2xl">{tr(locale, "Voucher usage history", "礼券使用历史")}</h2></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-sand-50 text-left text-xs text-brown-700/55"><tr><th className="px-5 py-3">{tr(locale, "Voucher", "礼券编号")}</th><th>{tr(locale, "Used at", "使用门店")}</th><th>{tr(locale, "Use date", "使用日期")}</th><th className="text-right">{tr(locale, "Amount", "使用金额")}</th><th /></tr></thead><tbody>{visibleRedemptions.length ? visibleRedemptions.map((row) => <tr key={row.id} className="border-t border-sand-100"><td className="px-5 py-3 font-medium">{saleById.get(row.gift_voucher_sale_id)?.voucher_number}</td><td>{relationOne(row.locations)?.name}</td><td>{row.used_date}</td><td className="text-right">{money(row.amount_cents)}</td><td className="pr-5 text-right"><form action={removeGiftVoucherRedemption}><input type="hidden" name="id" value={row.id} /><SubmitButton pendingLabel={tr(locale, "Removing…", "删除中…")} className="text-xs text-rose-700">{tr(locale, "Remove", "删除")}</SubmitButton></form></td></tr>) : <tr><td colSpan={5} className="py-10 text-center text-brown-700/45">{tr(locale, "No voucher usage on this date", "所选日期没有礼券使用记录")}</td></tr>}</tbody></table></div>
    </section>
  </div>;
}
