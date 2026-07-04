"use client";

import { useMemo, useRef, useState } from "react";

export type CalendarStatus = "unpaid" | "paid" | "no_show";
export type CalendarTherapist = { id: string; displayName: string };
export type CalendarBooking = {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  therapistId: string;
  startAt: string;
  endAt: string;
  calendarStatus: CalendarStatus;
  isAnyProfessional: boolean;
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

const ROW_HEIGHT = 56;
const HALF_HOUR = 30;
const SNAP_MINUTES = 15;
const MIN_DURATION = 15;
const TIME_ZONE = "Australia/Adelaide";
const labels = {
  en: { time: "Time", rostered: "Rostered today", saving: "Saving…", save: "Save", therapist: "Therapist", start: "Start", end: "End", duration: "Duration (minutes)", update: "Update appointment", calendarStatus: "Status", selectedProfessional: "Requested therapist", locked: "Therapist locked", appointments: "appointments", none: "No appointments", unpaid: "Unpaid", paid: "Paid", no_show: "No-show", error: "Could not update this appointment." },
  zh: { time: "时间", rostered: "今日上班", saving: "保存中…", save: "保存", therapist: "按摩师", start: "开始", end: "结束", duration: "时长（分钟）", update: "调整预约", calendarStatus: "状态", selectedProfessional: "指定按摩师", locked: "按摩师已锁定", appointments: "个预约", none: "暂无预约", unpaid: "未付款", paid: "已付款", no_show: "未到店", error: "无法更新此预约。" },
};

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

function cardClass(status: CalendarStatus) {
  return {
    unpaid: "border-amber-400 bg-amber-50 text-amber-950",
    paid: "border-sage-500 bg-sage-100 text-sage-800",
    no_show: "border-rose-400 bg-rose-50 text-rose-950",
  }[status];
}

export function BookingCalendar({ therapists, initialBookings, startMinute, endMinute, locale, updateAction }: { therapists: CalendarTherapist[]; initialBookings: CalendarBooking[]; startMinute: number; endMinute: number; locale: Locale; updateAction: (formData: FormData) => Promise<{ ok: true } | { ok: false; error: string }> }) {
  const t = labels[locale];
  const [bookings, setBookings] = useState(initialBookings);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [popoverDraft, setPopoverDraft] = useState<{ id: string; duration: number; status: CalendarStatus } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
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
      const result = await updateAction(formData);
      if (!result.ok) throw new Error(result.error || t.error);
    } catch (cause) {
      setBookings((current) => current.map((booking) => booking.id === previous.id ? previous : booking));
      setError(cause instanceof Error ? cause.message : t.error);
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
      setPopoverDraft(willOpen ? { id: current.id, duration: localMinutes(current.original.endAt) - localMinutes(current.original.startAt), status: current.original.calendarStatus } : null);
    }
  }

  const shownBookings = bookings.map((booking) => drag?.id === booking.id ? drag.preview : booking);

  function BookingCard({ booking }: { booking: CalendarBooking }) {
    const start = localMinutes(booking.startAt);
    const end = localMinutes(booking.endAt);
    const top = ((start - startMinute) / HALF_HOUR) * ROW_HEIGHT + 2;
    const height = Math.max(42, ((end - start) / HALF_HOUR) * ROW_HEIGHT - 4);
    const isDragging = drag?.id === booking.id;
    const originTherapist = isDragging ? drag.original.therapistId : booking.therapistId;
    const horizontalShift = (therapists.findIndex((therapist) => therapist.id === booking.therapistId) - therapists.findIndex((therapist) => therapist.id === originTherapist)) * 224;
    return <article
      className={`absolute inset-x-1.5 z-10 touch-none select-none rounded-lg border-l-4 p-2 shadow-sm transition-shadow ${cardClass(booking.calendarStatus)} ${isDragging ? "z-30 opacity-70 shadow-xl ring-2 ring-gold" : "hover:shadow-md"}`}
      style={{ top, height, transform: isDragging ? `translateX(${horizontalShift}px)` : undefined }}
      onPointerDown={(event) => beginPointer(event, booking, "move")}
      onPointerMove={movePointer}
      onPointerUp={endPointer}
      onPointerCancel={() => setDragState(null)}
    >
      <div className="flex items-start justify-between gap-1"><p className="truncate text-xs font-semibold">{booking.customerName}</p><span className="shrink-0 text-[10px] opacity-70">{timeLabel(start)}–{timeLabel(end)}</span></div>
      <p className="truncate text-[11px]">{booking.serviceName}</p>
      {!booking.isAnyProfessional && height >= 68 ? <p className="mt-0.5 truncate text-[9px] font-medium uppercase tracking-wide opacity-60">🔒 {t.selectedProfessional}</p> : null}
      {height >= 82 ? <p className="truncate text-[10px] opacity-60">{booking.reference} · {booking.customerPhone}</p> : null}
      {savingId === booking.id ? <span className="absolute inset-0 grid place-items-center rounded-lg bg-white/70 text-xs font-medium">{t.saving}</span> : null}
      <button type="button" aria-label={t.end} className="absolute inset-x-1 bottom-0 z-20 h-4 cursor-ns-resize touch-none rounded-md border-b-2 border-current/40 bg-current/10" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); beginPointer(event, booking, "resize"); }} onPointerMove={(event) => { event.stopPropagation(); movePointer(event); }} onPointerUp={(event) => { event.stopPropagation(); endPointer(event); }} onPointerCancel={() => setDragState(null)} />
      {isDragging ? <span className="absolute -top-7 left-1 rounded bg-brown-900 px-2 py-1 text-[10px] text-white shadow">{timeLabel(start)}–{timeLabel(end)}</span> : null}
      {openId === booking.id && popoverDraft?.id === booking.id && !drag ? <div className="absolute left-2 top-12 z-40 w-56 rounded-xl border border-sand-200 bg-white p-3 text-brown-900 shadow-xl" onPointerDown={(event) => event.stopPropagation()}>
        <p className="mb-2 text-xs font-semibold">{t.update}</p>
        {!booking.isAnyProfessional ? <p className="mb-2 rounded-md bg-sand-50 px-2 py-1.5 text-[10px] text-brown-700">🔒 {t.locked}</p> : null}
        <label className="block text-[10px] uppercase tracking-wide text-brown-700/60">{t.duration}<input type="number" min={15} step={5} value={popoverDraft.duration} onChange={(event) => setPopoverDraft({ ...popoverDraft, duration: Math.max(15, Number(event.target.value) || 15) })} className="mt-1 w-full rounded-lg border border-sand-200 px-2 py-1.5 text-xs" /></label>
        <label className="mt-2 block text-[10px] uppercase tracking-wide text-brown-700/60">{t.calendarStatus}<select value={popoverDraft.status} onChange={(event) => setPopoverDraft({ ...popoverDraft, status: event.target.value as CalendarStatus })} className="mt-1 w-full rounded-lg border border-sand-200 px-2 py-1.5 text-xs">{(["unpaid", "paid", "no_show"] as const).map((status) => <option key={status} value={status}>{t[status]}</option>)}</select></label>
        <button type="button" disabled={savingId === booking.id} onClick={() => { const duration = Math.max(15, popoverDraft.duration); void persist({ ...booking, endAt: shiftIso(booking.startAt, duration), calendarStatus: popoverDraft.status }, booking); setOpenId(null); setPopoverDraft(null); }} className="mt-3 w-full rounded-lg bg-brown-900 px-3 py-2 text-xs text-white disabled:opacity-50">{savingId === booking.id ? t.saving : t.save}</button>
      </div> : null}
    </article>;
  }

  return <>
    {error ? <div role="alert" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
    <div className="hidden overflow-x-auto rounded-2xl border border-sand-200 bg-cream-50 shadow-sm md:block">
      <div className="grid min-w-max" style={{ gridTemplateColumns: `5rem repeat(${therapists.length}, 14rem)` }}>
        <div className="sticky left-0 top-0 z-30 border-b border-r border-sand-200 bg-sand-50 p-3 text-xs font-medium uppercase tracking-wider text-brown-700/60">{t.time}</div>
        {therapists.map((therapist) => <div key={therapist.id} className="sticky top-0 z-20 border-b border-r border-sand-200 bg-sand-50 px-4 py-3"><p className="font-serif text-lg">{therapist.displayName}</p><p className="text-[10px] uppercase tracking-wider text-sage-700">{t.rostered}</p></div>)}
        <div className="sticky left-0 z-20 border-r border-sand-200 bg-cream-50">{slots.map((slot) => <div key={slot} className="border-b border-sand-100 px-3 pt-1 text-right text-[11px] text-brown-700/55" style={{ height: ROW_HEIGHT }}>{timeLabel(slot)}</div>)}</div>
        {therapists.map((therapist) => <div key={therapist.id} data-therapist-id={therapist.id} className="relative border-r border-sand-200 bg-[linear-gradient(to_bottom,transparent_55px,#eee3cf_56px)] bg-[length:100%_56px]" style={{ height: slots.length * ROW_HEIGHT }}>{bookings.filter((booking) => booking.therapistId === therapist.id).map((booking) => <BookingCard key={booking.id} booking={shownBookings.find((shown) => shown.id === booking.id) ?? booking} />)}</div>)}
      </div>
    </div>

    <div className="space-y-5 md:hidden">{therapists.map((therapist) => { const therapistBookings = bookings.filter((booking) => booking.therapistId === therapist.id); return <section key={therapist.id} className="overflow-hidden rounded-2xl border border-sand-200 bg-cream-50"><header className="border-b border-sand-200 bg-sand-50 px-4 py-3"><h2 className="font-serif text-xl">{therapist.displayName}</h2><p className="text-xs text-brown-700/55">{therapistBookings.length} {t.appointments}</p></header><div className="space-y-3 p-3">{therapistBookings.length ? therapistBookings.map((booking) => <MobileBooking key={booking.id} booking={booking} therapists={therapists} locale={locale} saving={savingId === booking.id} onSave={persist} />) : <p className="py-6 text-center text-sm text-brown-700/55">{t.none}</p>}</div></section>; })}</div>
  </>;
}

function MobileBooking({ booking, therapists, locale, saving, onSave }: { booking: CalendarBooking; therapists: CalendarTherapist[]; locale: Locale; saving: boolean; onSave: (next: CalendarBooking, previous: CalendarBooking) => Promise<void> }) {
  const t = labels[locale];
  const [draft, setDraft] = useState(booking);
  const start = localMinutes(draft.startAt);
  const duration = localMinutes(draft.endAt) - localMinutes(draft.startAt);
  const end = start + duration;
  function changeStart(value: string) { const [hour, minute] = value.split(":").map(Number); const delta = hour * 60 + minute - start; setDraft({ ...draft, startAt: shiftIso(draft.startAt, delta), endAt: shiftIso(draft.endAt, delta) }); }
  return <article className={`rounded-xl border-l-4 p-3 ${cardClass(booking.calendarStatus)}`}><div className="flex justify-between gap-3"><div><p className="font-medium">{booking.customerName}</p><p className="text-xs opacity-75">{booking.serviceName}</p>{!booking.isAnyProfessional ? <p className="mt-1 text-[10px] font-medium opacity-60">🔒 {t.selectedProfessional}</p> : null}</div><p className="shrink-0 text-xs font-medium">{timeLabel(start)}–{timeLabel(end)}</p></div><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-[10px] uppercase">{t.therapist}<select disabled={!booking.isAnyProfessional} value={draft.therapistId} onChange={(event) => setDraft({ ...draft, therapistId: event.target.value })} className="mt-1 w-full rounded-lg border border-current/20 bg-white/80 p-2 text-xs normal-case disabled:cursor-not-allowed disabled:opacity-60">{therapists.map((therapist) => <option key={therapist.id} value={therapist.id}>{therapist.displayName}</option>)}</select></label><label className="text-[10px] uppercase">{t.calendarStatus}<select value={draft.calendarStatus} onChange={(event) => setDraft({ ...draft, calendarStatus: event.target.value as CalendarStatus })} className="mt-1 w-full rounded-lg border border-current/20 bg-white/80 p-2 text-xs normal-case">{(["unpaid", "paid", "no_show"] as const).map((status) => <option key={status} value={status}>{t[status]}</option>)}</select></label><label className="text-[10px] uppercase">{t.start}<input type="time" step="900" value={timeLabel(start)} onChange={(event) => changeStart(event.target.value)} className="mt-1 w-full rounded-lg border border-current/20 bg-white/80 p-2 text-xs" /></label><label className="text-[10px] uppercase">{t.duration}<input type="number" min={15} step={5} value={duration} onChange={(event) => setDraft({ ...draft, endAt: shiftIso(draft.startAt, Math.max(15, Number(event.target.value) || 15)) })} className="mt-1 w-full rounded-lg border border-current/20 bg-white/80 p-2 text-xs" /></label></div><button type="button" disabled={saving} onClick={() => void onSave(draft, booking)} className="mt-3 w-full rounded-lg bg-brown-900 px-3 py-2 text-xs text-white disabled:opacity-50">{saving ? t.saving : t.save}</button></article>;
}
