"use client";

import { useEffect, useMemo, useState } from "react";
import { useBooking } from "@/components/booking/booking-context";
import { formatLongDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type StartTime = { startAt: string; time: string };
type StartTimesResponse = { slots: StartTime[]; hasRoster: boolean; message?: string };

function upcomingDays(count = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateKey = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    return { date, dateKey, weekday: date.toLocaleDateString("en-AU", { weekday: "short" }) };
  });
}

export function StepDateTime() {
  const { state, dispatch } = useBooking();
  const [availability, setAvailability] = useState<StartTimesResponse>({ slots: [], hasRoster: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const days = useMemo(() => upcomingDays(), []);
  const selectedDay = days.find((day) => day.dateKey === state.dateKey);

  useEffect(() => {
    if (!state.dateKey || !state.locationId) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ locationId: state.locationId, date: state.dateKey });
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
        return fetch(`/api/start-times?${params}`, { signal: controller.signal });
      })
      .then(async (response) => {
        const body = (await response.json()) as StartTimesResponse & { error?: string };
        if (!response.ok) throw new Error(body.error || "Unable to load availability.");
        return body;
      })
      .then(setAvailability)
      .catch((caught: unknown) => {
        if ((caught as Error).name !== "AbortError") {
          setError((caught as Error).message);
          setAvailability({ slots: [], hasRoster: false });
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [state.dateKey, state.locationId]);

  return <div>
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">Live availability</p>
      <h2 className="mt-2 font-serif text-2xl font-medium text-brown-900">Pick a date &amp; start time</h2>
      <p className="mt-1 text-sm text-brown-700/70">Times are generated from this studio&apos;s daily roster. Treatment choices shown later will fit the time you select.</p>
    </div>
    <p className="mb-2 text-sm font-medium text-brown-800">Select a day</p>
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {days.map((day) => {
        const selected = state.dateKey === day.dateKey;
        return <button key={day.dateKey} type="button" onClick={() => dispatch({ type: "SET_DATE", dateKey: day.dateKey })} className={cn("flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-3 transition-all", selected ? "border-sage-500 bg-sage-600 text-cream-50 shadow-sm" : "border-sand-200 bg-cream-50 text-brown-800 hover:border-sage-300")}>
          <span className={cn("text-[0.65rem] uppercase tracking-wide", selected ? "text-cream-50/80" : "text-brown-700/60")}>{day.weekday}</span>
          <span className="mt-1 text-lg font-semibold">{day.date.getDate()}</span>
          <span className={cn("text-[0.6rem]", selected ? "text-cream-50/80" : "text-brown-700/50")}>{day.date.toLocaleDateString("en-AU", { month: "short" })}</span>
        </button>;
      })}
    </div>
    <div className="mt-6">
      {!selectedDay ? <p className="rounded-2xl border border-dashed border-sand-200 px-4 py-8 text-center text-sm text-brown-700/60">Select a day to see available start times.</p>
        : loading ? <p className="flex items-center justify-center gap-3 rounded-2xl border border-sand-100 bg-sand-50 px-4 py-8 text-sm text-brown-700/70"><span className="size-4 animate-spin rounded-full border-2 border-sage-600 border-r-transparent" />Checking the daily roster&hellip;</p>
        : error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">{error}</p>
        : availability.slots.length === 0 ? <p className="rounded-2xl border border-dashed border-sand-200 px-4 py-8 text-center text-sm text-brown-700/70">{availability.message || "No online availability for this date. Please call the store to book."}</p>
        : <><p className="mb-3 text-sm font-medium text-brown-800">Available start times · {formatLongDate(selectedDay.date)}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {availability.slots.map((slot) => {
            const selected = state.startAt === slot.startAt;
            return <button key={slot.startAt} type="button" onClick={() => dispatch({ type: "SELECT_START_TIME", time: slot.time, startAt: slot.startAt })} className={cn("rounded-xl border px-3 py-3 text-center transition-all", selected ? "border-sage-500 bg-sage-600 text-cream-50 shadow-sm" : "border-sand-200 bg-cream-50 text-brown-800 hover:border-sage-300")}><span className="text-sm font-semibold">{formatTime(slot.time)}</span></button>;
          })}
        </div></>}
    </div>
  </div>;
}
