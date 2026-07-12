"use client";

import { useMemo, useRef, useState } from "react";
import { updateRosterHours } from "@/app/admin/actions";

export type CalendarStatus = "unpaid" | "paid" | "no_show";
export type CalendarTherapist = { id: string; displayName: string; rosterId: string; startTime: string; endTime: string };
export type CalendarBooking = {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  servicePrice: number;
  therapistId: string;
  startAt: string;
  endAt: string;
  calendarStatus: CalendarStatus;
  isAnyProfessional: boolean;
  paymentAmounts: {
    card: number;
    insurance: number;
    cash: number;
    voucher: number;
    waived: number;
  };
  voucherNumber: string;
};

type Locale = "en" | "zh";
type DragState = {
  id: string;
  mode: "move" | "resize";
  pointerId: number;
  originY: number;
  original: CalendarBooking;
  preview: CalendarBooking;
  moved: boolean;
};

const ROW_HEIGHT = 40;
const HALF_HOUR = 30;
const SNAP_MINUTES = 15;
const MIN_DURATION = 15;
const TIME_ZONE = "Australia/Adelaide";
const labels = {
  en: { time: "Time", rostered: "Rostered today", saving: "Saving…", save: "Save", cancelling: "Cancelling…", cancel: "Cancel appointment", confirmCancel: "Confirm cancellation", therapist: "Therapist", start: "Start", end: "End", duration: "Duration (minutes)", update: "Update appointment", paymentMethods: "Payment methods", selectedProfessional: "Requested therapist", locked: "Therapist locked", appointments: "appointments", none: "No appointments", card: "Card", insurance: "Insurance", cash: "Cash", voucher: "Voucher", waived: "Waived", amountError: "Enter valid amounts only.", error: "Could not update this appointment.", cancelError: "Could not cancel this appointment." },
  zh: { time: "时间", rostered: "今日上班", saving: "保存中…", save: "保存", cancelling: "正在取消…", cancel: "取消预约", confirmCancel: "确认取消预约", therapist: "按摩师", start: "开始", end: "结束", duration: "时长（分钟）", update: "调整预约", paymentMethods: "支付方式", selectedProfessional: "指定按摩师", locked: "按摩师已锁定", appointments: "个预约", none: "暂无预约", card: "刷卡", insurance: "保险", cash: "现金", voucher: "礼券", waived: "减免", amountError: "请输入有效金额。", error: "无法更新此预约。", cancelError: "无法取消此预约。" },
};
const paymentKeys = ["card", "insurance", "cash", "voucher", "waived"] as const;
type PaymentKey = typeof paymentKeys[number];
type PaymentDraft = Record<PaymentKey, string>;

function localMinutes(iso: string) {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  return Number(parts.find((part) => part.type === "hour")?.value ?? 0) * 60 + Number(parts.find((part) => part.type === "minute")?.value ?? 0);
}

function timeLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function shiftIso(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function serviceLabelWithActualDuration(serviceName: string, startAt: string, endAt: string) {
  const baseName = serviceName.replace(/\s*[-–—]\s*\d+\s*min(?:ute)?s?\s*$/i, "").trim();
  const duration = Math.max(0, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000));
  return `${baseName} — ${duration} min`;
}

function cardClass(status: CalendarStatus) {
  return {
    unpaid: "border-amber-400 bg-amber-50 text-amber-950",
    paid: "border-sage-500 bg-sage-100 text-sage-800",
    no_show: "border-rose-400 bg-rose-50 text-rose-950",
  }[status];
}

export function BookingCalendar({ therapists, initialBookings, startMinute, endMinute, locale, updateAction, cancelAction }: { therapists: CalendarTherapist[]; initialBookings: CalendarBooking[]; startMinute: number; endMinute: number; locale: Locale; updateAction: (formData: FormData) => Promise<{ ok: true } | { ok: false; error: string }>; cancelAction: (formData: FormData) => Promise<{ ok: true } | { ok: false; error: string }> }) {
  const t = labels[locale];
  const [bookings, setBookings] = useState(initialBookings);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [popoverDraft, setPopoverDraft] = useState<{ id: string; duration: string; startTime: string; endTime: string; therapistId: string; payment: PaymentDraft; voucherNumber: string } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const slots = useMemo(() => Array.from({ length: Math.max(1, (endMinute - startMinute) / HALF_HOUR) }, (_, index) => startMinute + index * HALF_HOUR), [startMinute, endMinute]);

  function setDragState(next: DragState | null) {
    dragRef.current = next;
    setDrag(next);
  }

  async function persist(next: CalendarBooking, previous: CalendarBooking) {
    setSavingId(next.id);
    setError("");
    setBookings((current) => current.map((booking) => booking.id === next.id ? next : booking));
    try {
      const formData = new FormData();
      formData.set("id", next.id);
      formData.set("therapist_id", next.therapistId);
      formData.set("start_at", next.startAt);
      formData.set("end_at", next.endAt);
      formData.set("calendar_status", next.calendarStatus);
      formData.set("card_amount", String(next.paymentAmounts.card));
      formData.set("insurance_amount", String(next.paymentAmounts.insurance));
      formData.set("cash_amount", String(next.paymentAmounts.cash));
      formData.set("voucher_amount", String(next.paymentAmounts.voucher));
      formData.set("waived_amount", String(next.paymentAmounts.waived));
      formData.set("voucher_number", next.voucherNumber);
      const result = await updateAction(formData);
      if (!result.ok) throw new Error(result.error || t.error);
    } catch (cause) {
      setBookings((current) => current.map((booking) => booking.id === previous.id ? previous : booking));
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setSavingId(null);
    }
  }

  function toPaymentDraft(booking: CalendarBooking): PaymentDraft {
    return {
      card: String(booking.paymentAmounts.card || 0),
      insurance: String(booking.paymentAmounts.insurance || 0),
      cash: String(booking.paymentAmounts.cash || 0),
      voucher: String(booking.paymentAmounts.voucher || 0),
      waived: String(booking.paymentAmounts.waived || 0),
    };
  }

  function parsePaymentDraft(payment: PaymentDraft) {
    const entries = paymentKeys.map((key) => {
      const raw = payment[key].trim();
      const value = raw ? Number(raw) : 0;
      return [key, value] as const;
    });
    if (entries.some(([, value]) => !Number.isFinite(value) || value < 0)) {
      return null;
    }
    return Object.fromEntries(entries) as CalendarBooking["paymentAmounts"];
  }

  function paymentTotal(payment: CalendarBooking["paymentAmounts"]) {
    return paymentKeys.reduce((sum, key) => sum + payment[key], 0);
  }

  async function cancelBooking(booking: CalendarBooking) {
    setSavingId(booking.id);
    setError("");
    try {
      const formData = new FormData();
      formData.set("id", booking.id);
      const result = await cancelAction(formData);
      if (!result.ok) throw new Error(result.error || t.cancelError);
      setBookings((current) => current.filter((item) => item.id !== booking.id));
      setOpenId(null);
      setPopoverDraft(null);
      setCancelConfirmId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.cancelError);
    } finally {
      setSavingId(null);
    }
  }

  function beginPointer(event: React.PointerEvent, booking: CalendarBooking, mode: "move" | "resize") {
    if (savingId || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ id: booking.id, mode, pointerId: event.pointerId, originY: event.clientY, original: booking, preview: booking, moved: false });
  }

  function movePointer(event: React.PointerEvent) {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const delta = Math.round(((event.clientY - current.originY) / ROW_HEIGHT * HALF_HOUR) / SNAP_MINUTES) * SNAP_MINUTES;
    let preview = current.original;
    if (current.mode === "resize") {
      const duration = Math.max(MIN_DURATION, (localMinutes(current.original.endAt) - localMinutes(current.original.startAt)) + delta);
      preview = { ...current.original, endAt: shiftIso(current.original.startAt, duration) };
    } else {
      const duration = localMinutes(current.original.endAt) - localMinutes(current.original.startAt);
      const rawStart = localMinutes(current.original.startAt) + ((event.clientY - current.originY) / ROW_HEIGHT * HALF_HOUR);
      const desiredStart = Math.max(startMinute, Math.min(endMinute - duration, Math.round(rawStart / SNAP_MINUTES) * SNAP_MINUTES));
      const snappedDelta = desiredStart - localMinutes(current.original.startAt);
      const target = current.original.isAnyProfessional
        ? document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-therapist-id]")?.dataset.therapistId
        : current.original.therapistId;
      preview = { ...current.original, therapistId: target || current.original.therapistId, startAt: shiftIso(current.original.startAt, snappedDelta), endAt: shiftIso(current.original.endAt, snappedDelta) };
    }
    setDragState({ ...current, preview, moved: current.moved || Math.abs(event.clientY - current.originY) > 3 || preview.therapistId !== current.original.therapistId });
  }

  function endPointer(event: React.PointerEvent) {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    setDragState(null);
    if (current.moved) void persist(current.preview, current.original);
    else {
      const willOpen = openId !== current.id;
      setOpenId(willOpen ? current.id : null);
      setCancelConfirmId(null);
      setPopoverDraft(willOpen ? { id: current.id, duration: String(localMinutes(current.original.endAt) - localMinutes(current.original.startAt)), startTime: timeLabel(localMinutes(current.original.startAt)), endTime: timeLabel(localMinutes(current.original.endAt)), therapistId: current.original.therapistId, payment: toPaymentDraft(current.original), voucherNumber: current.original.voucherNumber } : null);
    }
  }

  const shownBookings = bookings.map((booking) => drag?.id === booking.id ? drag.preview : booking);

  function renderBookingCard(booking: CalendarBooking) {
    const start = localMinutes(booking.startAt);
    const end = localMinutes(booking.endAt);
    const top = ((start - startMinute) / HALF_HOUR) * ROW_HEIGHT + 2;
    const height = Math.max(42, ((end - start) / HALF_HOUR) * ROW_HEIGHT - 4);
    const isDragging = drag?.id === booking.id;
    const isOpen = openId === booking.id && popoverDraft?.id === booking.id;
    const originTherapist = isDragging ? drag.original.therapistId : booking.therapistId;
    const horizontalShift = (therapists.findIndex((therapist) => therapist.id === booking.therapistId) - therapists.findIndex((therapist) => therapist.id === originTherapist)) * 224;
    const draftPayment = isOpen ? parsePaymentDraft(popoverDraft.payment) : null;
    const draftPaymentTotal = draftPayment ? paymentTotal(draftPayment) : 0;
    const amountMismatch = Boolean(draftPayment) && draftPaymentTotal > 0 && Math.abs(draftPaymentTotal - booking.servicePrice) > 0.009;
    return <article
      key={booking.id}
      className={`absolute inset-x-1.5 touch-none select-none rounded-lg border-l-4 p-2 shadow-sm transition-shadow ${cardClass(booking.calendarStatus)} ${isDragging ? "z-40 opacity-70 shadow-xl ring-2 ring-gold" : isOpen ? "z-30 shadow-lg" : "z-10 hover:shadow-md"}`}
      style={{ top, height, transform: isDragging ? `translateX(${horizontalShift}px)` : undefined }}
      onPointerDown={(event) => beginPointer(event, booking, "move")}
      onPointerMove={movePointer}
      onPointerUp={endPointer}
      onPointerCancel={() => setDragState(null)}
    >
      <div className="flex items-start justify-between gap-1"><p className="truncate text-xs font-semibold">{booking.customerName}</p><span className="shrink-0 text-[10px] opacity-70">{timeLabel(start)}–{timeLabel(end)}</span></div>
      <p className="truncate text-[11px]">{serviceLabelWithActualDuration(booking.serviceName, booking.startAt, booking.endAt)}</p>
      {!booking.isAnyProfessional && height >= 68 ? <p className="mt-0.5 truncate text-[9px] font-medium uppercase tracking-wide opacity-60">🔒 {t.selectedProfessional}</p> : null}
      {height >= 82 ? <p className="truncate text-[10px] opacity-60">{booking.reference} · {booking.customerPhone}</p> : null}
      {savingId === booking.id ? <span className="absolute inset-0 grid place-items-center rounded-lg bg-white/70 text-xs font-medium">{t.saving}</span> : null}
      <button type="button" aria-label={t.end} className="absolute inset-x-1 bottom-0 z-20 h-4 cursor-ns-resize touch-none rounded-md border-b-2 border-current/40 bg-current/10" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); beginPointer(event, booking, "resize"); }} onPointerMove={(event) => { event.stopPropagation(); movePointer(event); }} onPointerUp={(event) => { event.stopPropagation(); endPointer(event); }} onPointerCancel={() => setDragState(null)} />
      {isDragging ? <span className="absolute -top-7 left-1 rounded bg-brown-900 px-2 py-1 text-[10px] text-white shadow">{timeLabel(start)}–{timeLabel(end)}</span> : null}
      {isOpen && !drag ? <div className="absolute left-2 top-12 z-[80] w-72 touch-auto select-text rounded-2xl border border-sand-200 bg-white p-4 text-brown-900 shadow-2xl ring-1 ring-brown-900/5" onPointerDown={(event) => event.stopPropagation()} onPointerMove={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} onPointerCancel={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
        <p className="mb-2 text-xs font-semibold">{t.update}</p>
        <label className="mb-2 block text-[10px] uppercase tracking-wide text-brown-700/60">
          {t.therapist}
          <select
            value={popoverDraft.therapistId}
            onChange={(event) => setPopoverDraft({ ...popoverDraft, therapistId: event.target.value })}
            className="mt-1 w-full rounded-lg border border-sand-200 px-2 py-1.5 text-xs normal-case"
          >
            {therapists.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>{therapist.displayName}</option>
            ))}
          </select>
        </label>
        <div className="mb-2 grid grid-cols-2 gap-2"><label className="block text-[10px] uppercase tracking-wide text-brown-700/60">{locale === "zh" ? "开始时间" : "Start time"}<input type="time" step={300} value={popoverDraft.startTime} onChange={(event) => { const value = event.target.value; const [hour, minute] = value.split(":").map(Number); const duration = Math.max(15, Number(popoverDraft.duration) || 15); setPopoverDraft({ ...popoverDraft, startTime: value, endTime: timeLabel(hour * 60 + minute + duration) }); }} className="mt-1 w-full rounded-lg border border-sand-200 px-2 py-1.5 text-xs" /></label><label className="block text-[10px] uppercase tracking-wide text-brown-700/60">{locale === "zh" ? "结束时间" : "End time"}<input type="time" step={300} value={popoverDraft.endTime} onChange={(event) => { const value = event.target.value; const [startHour, startMinuteValue] = popoverDraft.startTime.split(":").map(Number); const [endHour, endMinuteValue] = value.split(":").map(Number); const duration = endHour * 60 + endMinuteValue - (startHour * 60 + startMinuteValue); setPopoverDraft({ ...popoverDraft, endTime: value, duration: duration > 0 ? String(duration) : popoverDraft.duration }); }} className="mt-1 w-full rounded-lg border border-sand-200 px-2 py-1.5 text-xs" /></label></div>
        <label className="block text-[10px] uppercase tracking-wide text-brown-700/60">{t.duration}<input type="number" inputMode="numeric" min={15} step={5} value={popoverDraft.duration} onChange={(event) => { const value = event.target.value; const duration = Number(value); const [hour, minute] = popoverDraft.startTime.split(":").map(Number); const end = hour * 60 + minute + duration; setPopoverDraft({ ...popoverDraft, duration: value, endTime: Number.isFinite(end) ? timeLabel(end) : popoverDraft.endTime }); }} onBlur={() => setPopoverDraft({ ...popoverDraft, duration: String(Math.max(15, Number(popoverDraft.duration) || 15)) })} className="mt-1 w-full touch-auto select-text rounded-lg border border-sand-200 px-2 py-1.5 text-xs" /></label>
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-brown-700/60">{t.paymentMethods}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {paymentKeys.map((key) => <label key={key} className={`block text-[10px] uppercase tracking-wide text-brown-700/60 ${key === "waived" ? "col-span-2" : ""}`}>{t[key]}<input type="number" inputMode="decimal" min={0} step={0.01} value={popoverDraft.payment[key]} onChange={(event) => setPopoverDraft({ ...popoverDraft, payment: { ...popoverDraft.payment, [key]: event.target.value } })} className="mt-1 w-full rounded-lg border border-sand-200 px-2 py-1.5 text-xs" /></label>)}
          </div>
          <p className={`mt-2 text-[10px] ${amountMismatch ? "font-semibold text-red-600" : "text-brown-700/55"}`}>
            {locale === "zh" ? "应收" : "Expected"} ${booking.servicePrice.toFixed(2)}
            {" · "}
            {locale === "zh" ? "已填" : "Entered"} ${draftPaymentTotal.toFixed(2)}
            {amountMismatch ? ` · ${locale === "zh" ? "金额不一致" : "Amount does not match"}` : ""}
          </p>
          {Number(popoverDraft.payment.voucher) > 0 ? <label className="mt-2 block text-[10px] uppercase tracking-wide text-brown-700/60">{locale === "zh" ? "礼券编号" : "Voucher number"}<input value={popoverDraft.voucherNumber} onChange={(event) => setPopoverDraft({ ...popoverDraft, voucherNumber: event.target.value })} className="mt-1 w-full rounded-lg border border-sand-200 px-2 py-1.5 text-xs normal-case" /></label> : null}
        </div>
        <button type="button" disabled={savingId === booking.id} onClick={() => { const startParts = popoverDraft.startTime.split(":").map(Number); const endParts = popoverDraft.endTime.split(":").map(Number); const startMinutes = startParts[0] * 60 + startParts[1]; const endMinutes = endParts[0] * 60 + endParts[1]; if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) { setError(locale === "zh" ? "结束时间必须晚于开始时间。" : "End time must be later than start time."); return; } const nextStartAt = shiftIso(booking.startAt, startMinutes - localMinutes(booking.startAt)); const nextEndAt = shiftIso(booking.endAt, endMinutes - localMinutes(booking.endAt)); const paymentAmounts = parsePaymentDraft(popoverDraft.payment); if (!paymentAmounts) { setError(t.amountError); return; } if (paymentAmounts.voucher > 0 && !popoverDraft.voucherNumber.trim()) { setError(locale === "zh" ? "请输入使用的礼券编号。" : "Enter the gift voucher number."); return; } const total = paymentTotal(paymentAmounts); if (total > 0 && Math.abs(total - booking.servicePrice) > 0.009) { setError(locale === "zh" ? `付款合计必须等于项目金额 $${booking.servicePrice.toFixed(2)}。` : `Payment total must equal $${booking.servicePrice.toFixed(2)}.`); return; } void persist({ ...booking, therapistId: popoverDraft.therapistId, startAt: nextStartAt, endAt: nextEndAt, paymentAmounts, voucherNumber: popoverDraft.voucherNumber }, booking); setOpenId(null); setPopoverDraft(null); }} className="mt-4 w-full rounded-lg bg-brown-900 px-3 py-2 text-xs text-white disabled:opacity-50">{savingId === booking.id ? t.saving : t.save}</button>
        <button type="button" disabled={savingId === booking.id} onClick={() => cancelConfirmId === booking.id ? void cancelBooking(booking) : setCancelConfirmId(booking.id)} className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50 ${cancelConfirmId === booking.id ? "border-red-700 bg-red-700 text-white" : "border-red-200 text-red-700 hover:bg-red-50"}`}>{savingId === booking.id ? t.cancelling : cancelConfirmId === booking.id ? t.confirmCancel : t.cancel}</button>
      </div> : null}
    </article>;
  }

  return <>
    {error ? <div role="alert" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
    <div className="hidden overflow-x-auto rounded-2xl border border-sand-200 bg-cream-50 shadow-sm md:block">
      <div className="grid min-w-max" style={{ gridTemplateColumns: `5rem repeat(${therapists.length}, 14rem)` }}>
        <div className="sticky left-0 top-0 z-30 border-b border-r border-sand-200 bg-sand-50 p-3 text-xs font-medium uppercase tracking-wider text-brown-700/60">{t.time}</div>
        {therapists.map((therapist) => <RosterHeader key={therapist.id} therapist={therapist} locale={locale} />)}
        <div className="sticky left-0 z-20 border-r border-sand-200 bg-cream-50">{slots.map((slot) => <div key={slot} className="border-b border-sand-100 px-3 pt-1 text-right text-[11px] text-brown-700/55" style={{ height: ROW_HEIGHT }}>{timeLabel(slot)}</div>)}</div>
        {therapists.map((therapist) => <div key={therapist.id} data-therapist-id={therapist.id} className="relative border-r border-sand-200" style={{ height: slots.length * ROW_HEIGHT, backgroundImage: `linear-gradient(to bottom, transparent ${ROW_HEIGHT - 1}px, #eee3cf ${ROW_HEIGHT}px)`, backgroundSize: `100% ${ROW_HEIGHT}px` }}>{bookings.filter((booking) => booking.therapistId === therapist.id).map((booking) => renderBookingCard(shownBookings.find((shown) => shown.id === booking.id) ?? booking))}</div>)}
        <div className="sticky left-0 z-20 border-r border-t border-sand-200 bg-brown-900 px-3 py-3 text-right text-[11px] font-medium text-cream-50">{locale === "zh" ? "今日分钟" : "Minutes today"}</div>
        {therapists.map((therapist) => { const total = bookings.filter((booking) => booking.therapistId === therapist.id).reduce((sum, booking) => sum + Math.max(0, localMinutes(booking.endAt) - localMinutes(booking.startAt)), 0); return <div key={`${therapist.id}-total`} className="border-r border-t border-sand-200 bg-brown-900 px-4 py-3 text-sm font-semibold text-cream-50">{total} min</div>; })}
        <div className="sticky left-0 z-20 border-r border-t border-cream-100/15 bg-brown-900 px-3 py-3 text-right text-[11px] font-medium text-cream-50">{locale === "zh" ? "指定时长" : "Requested minutes"}</div>
        {therapists.map((therapist) => { const requested = bookings.filter((booking) => booking.therapistId === therapist.id && !booking.isAnyProfessional).reduce((sum, booking) => sum + Math.max(0, localMinutes(booking.endAt) - localMinutes(booking.startAt)), 0); return <div key={`${therapist.id}-requested`} className="border-r border-t border-cream-100/15 bg-brown-900 px-4 py-3 text-sm font-semibold text-gold-light">{requested} min</div>; })}
      </div>
    </div>

    <div className="space-y-5 md:hidden">{therapists.map((therapist) => { const therapistBookings = bookings.filter((booking) => booking.therapistId === therapist.id); const totalMinutes = therapistBookings.reduce((sum, booking) => sum + Math.max(0, localMinutes(booking.endAt) - localMinutes(booking.startAt)), 0); const requestedMinutes = therapistBookings.filter((booking) => !booking.isAnyProfessional).reduce((sum, booking) => sum + Math.max(0, localMinutes(booking.endAt) - localMinutes(booking.startAt)), 0); return <section key={therapist.id} className="overflow-hidden rounded-2xl border border-sand-200 bg-cream-50"><header className="border-b border-sand-200 bg-sand-50 px-4 py-3"><h2 className="font-serif text-xl">{therapist.displayName}</h2><p className="text-xs text-brown-700/55">{therapistBookings.length} {t.appointments} · {locale === "zh" ? "今日分钟" : "Minutes today"} {totalMinutes} min · {locale === "zh" ? "指定时长" : "Requested"} {requestedMinutes} min</p></header><div className="space-y-3 p-3">{therapistBookings.length ? therapistBookings.map((booking) => <MobileBooking key={booking.id} booking={booking} therapists={therapists} locale={locale} saving={savingId === booking.id} onSave={persist} onCancel={cancelBooking} />) : <p className="py-6 text-center text-sm text-brown-700/55">{t.none}</p>}</div></section>; })}</div>
  </>;
}

function RosterHeader({ therapist, locale }: { therapist: CalendarTherapist; locale: Locale }) {
  const [startTime, setStartTime] = useState(therapist.startTime || "09:00");
  const [endTime, setEndTime] = useState(therapist.endTime || "17:30");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setSaving(true); setMessage("");
    const formData = new FormData(); formData.set("roster_id", therapist.rosterId); formData.set("start_time", startTime); formData.set("end_time", endTime);
    const result = await updateRosterHours(formData); setMessage(result.ok ? (locale === "zh" ? "已保存" : "Saved") : result.error); setSaving(false);
  }
  return <div className="sticky top-0 z-20 border-b border-r border-sand-200 bg-sand-50 px-3 py-2"><div className="flex items-center justify-between gap-2"><p className="font-serif text-lg">{therapist.displayName}</p><button type="button" disabled={saving} onClick={() => void save()} className="text-[10px] font-medium text-sage-700 disabled:opacity-50">{saving ? "…" : locale === "zh" ? "保存" : "Save"}</button></div><div className="mt-1 flex items-center gap-1 text-[10px] text-brown-700/60"><input aria-label={`${therapist.displayName} ${locale === "zh" ? "到店时间" : "arrival time"}`} type="time" step={300} value={startTime} onChange={(event) => setStartTime(event.target.value)} className="w-[70px] rounded border border-sand-200 bg-white px-1 py-0.5" /><span>–</span><input aria-label={`${therapist.displayName} ${locale === "zh" ? "离店时间" : "departure time"}`} type="time" step={300} value={endTime} onChange={(event) => setEndTime(event.target.value)} className="w-[70px] rounded border border-sand-200 bg-white px-1 py-0.5" /></div>{message ? <p className="mt-0.5 truncate text-[9px] text-sage-700">{message}</p> : null}</div>;
}

function MobileBooking({ booking, therapists, locale, saving, onSave, onCancel }: { booking: CalendarBooking; therapists: CalendarTherapist[]; locale: Locale; saving: boolean; onSave: (next: CalendarBooking, previous: CalendarBooking) => Promise<void>; onCancel: (booking: CalendarBooking) => Promise<void> }) {
  const t = labels[locale];
  const [draft, setDraft] = useState(booking);
  const [durationInput, setDurationInput] = useState(String(localMinutes(booking.endAt) - localMinutes(booking.startAt)));
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({
    card: String(booking.paymentAmounts.card || 0),
    insurance: String(booking.paymentAmounts.insurance || 0),
    cash: String(booking.paymentAmounts.cash || 0),
    voucher: String(booking.paymentAmounts.voucher || 0),
    waived: String(booking.paymentAmounts.waived || 0),
  });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const start = localMinutes(draft.startAt);
  const duration = localMinutes(draft.endAt) - localMinutes(draft.startAt);
  const end = start + duration;
  function changeStart(value: string) { const [hour, minute] = value.split(":").map(Number); const delta = hour * 60 + minute - start; setDraft({ ...draft, startAt: shiftIso(draft.startAt, delta), endAt: shiftIso(draft.endAt, delta) }); }
  return <article className={`rounded-xl border-l-4 p-3 ${cardClass(booking.calendarStatus)}`}><div className="flex justify-between gap-3"><div><p className="font-medium">{booking.customerName}</p><p className="text-xs opacity-75">{serviceLabelWithActualDuration(booking.serviceName, draft.startAt, draft.endAt)}</p>{!booking.isAnyProfessional ? <p className="mt-1 text-[10px] font-medium opacity-60">🔒 {t.selectedProfessional}</p> : null}</div><p className="shrink-0 text-xs font-medium">{timeLabel(start)}–{timeLabel(end)}</p></div><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-[10px] uppercase">{t.therapist}<select disabled={!booking.isAnyProfessional} value={draft.therapistId} onChange={(event) => setDraft({ ...draft, therapistId: event.target.value })} className="mt-1 w-full rounded-lg border border-current/20 bg-white/80 p-2 text-xs normal-case disabled:cursor-not-allowed disabled:opacity-60">{therapists.map((therapist) => <option key={therapist.id} value={therapist.id}>{therapist.displayName}</option>)}</select></label><label className="text-[10px] uppercase">{t.start}<input type="time" step="900" value={timeLabel(start)} onChange={(event) => changeStart(event.target.value)} className="mt-1 w-full rounded-lg border border-current/20 bg-white/80 p-2 text-xs" /></label><label className="text-[10px] uppercase">{t.duration}<input type="number" inputMode="numeric" min={15} step={5} value={durationInput} onChange={(event) => setDurationInput(event.target.value)} onBlur={() => { const nextDuration = Math.max(15, Number(durationInput) || 15); setDurationInput(String(nextDuration)); setDraft({ ...draft, endAt: shiftIso(draft.startAt, nextDuration) }); }} className="mt-1 w-full select-text rounded-lg border border-current/20 bg-white/80 p-2 text-xs" /></label></div><div className="mt-3 grid grid-cols-2 gap-2">{paymentKeys.map((key) => <label key={key} className={`text-[10px] uppercase ${key === "waived" ? "col-span-2" : ""}`}>{t[key]}<input type="number" inputMode="decimal" min={0} step={0.01} value={paymentDraft[key]} onChange={(event) => setPaymentDraft({ ...paymentDraft, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-current/20 bg-white/80 p-2 text-xs normal-case" /></label>)}</div><button type="button" disabled={saving} onClick={() => { const nextDuration = Math.max(15, Number(durationInput) || 15); const paymentAmounts = Object.fromEntries(paymentKeys.map((key) => [key, paymentDraft[key].trim() ? Number(paymentDraft[key]) : 0])) as CalendarBooking["paymentAmounts"]; if (Object.values(paymentAmounts).some((value) => !Number.isFinite(value) || value < 0)) { return; } void onSave({ ...draft, endAt: shiftIso(draft.startAt, nextDuration), paymentAmounts }, booking); }} className="mt-3 w-full rounded-lg bg-brown-900 px-3 py-2 text-xs text-white disabled:opacity-50">{saving ? t.saving : t.save}</button><button type="button" disabled={saving} onClick={() => confirmCancel ? void onCancel(booking) : setConfirmCancel(true)} className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50 ${confirmCancel ? "border-red-700 bg-red-700 text-white" : "border-red-200 text-red-700"}`}>{saving ? t.cancelling : confirmCancel ? t.confirmCancel : t.cancel}</button></article>;
}
