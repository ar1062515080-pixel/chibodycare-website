"use client";

import { useMemo, useState } from "react";
import { redeemGiftVoucher } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import type { AdminLocale } from "@/lib/admin-i18n";

type VoucherBalance = { voucherNumber: string; balanceCents: number };

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

export function VoucherRedemptionForm({ locationId, usedDate, locale, vouchers }: { locationId: string; usedDate: string; locale: AdminLocale; vouchers: VoucherBalance[] }) {
  const [voucherNumber, setVoucherNumber] = useState("");
  const [amount, setAmount] = useState("");
  const voucher = useMemo(
    () => vouchers.find((item) => item.voucherNumber.toLocaleLowerCase() === voucherNumber.trim().toLocaleLowerCase()),
    [voucherNumber, vouchers],
  );
  const amountCents = Math.round((Number(amount) || 0) * 100);
  const remainingCents = voucher ? Math.max(0, voucher.balanceCents - amountCents) : null;

  return (
    <form action={redeemGiftVoucher} className="mt-5 space-y-4">
      <input type="hidden" name="location_id" value={locationId} />
      <input type="hidden" name="used_date" value={usedDate} />
      <label className="block text-xs font-medium">
        {locale === "zh" ? "礼券编号" : "Voucher number"}
        <input required name="voucher_number" value={voucherNumber} onChange={(event) => setVoucherNumber(event.target.value)} placeholder={locale === "zh" ? "输入礼券编号" : "Enter voucher number"} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium">
          {locale === "zh" ? "本次使用金额" : "Amount to use"}
          <input required type="number" min="0.01" step="0.01" name="amount" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 block w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm" />
        </label>
        <label className="block text-xs font-medium">
          {locale === "zh" ? "礼券余额" : "Voucher balance"}
          <output className="mt-1 flex min-h-10 w-full items-center rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-sm font-semibold text-brown-900">
            {remainingCents === null ? "—" : formatMoney(remainingCents)}
          </output>
        </label>
      </div>
      <SubmitButton pendingLabel={locale === "zh" ? "保存中…" : "Saving…"} className="w-full rounded-xl bg-gold-dark px-5 py-3 text-sm text-white">{locale === "zh" ? "记录礼券使用" : "Record voucher use"}</SubmitButton>
    </form>
  );
}
