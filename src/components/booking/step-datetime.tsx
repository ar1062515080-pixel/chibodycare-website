"use client";

import { useMemo, useState } from "react";
import { useBooking } from "@/components/booking/booking-context";

function todayDateKey() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function toStartAt(dateKey: string, time: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

export function StepDateTime() {
  const { state, dispatch } = useBooking();
  const minDateKey = useMemo(() => todayDateKey(), []);
  const [timeValue, setTimeValue] = useState(state.time ?? "");

  const applyDateTime = (dateKey: string, time: string) => {
    if (!dateKey || dateKey < minDateKey) return;
    dispatch({ type: "SET_DATE", dateKey });

    const startAt = toStartAt(dateKey, time);
    if (startAt) {
      dispatch({ type: "SELECT_START_TIME", time, startAt });
    }
  };

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">
          Live availability
        </p>
        <h2 className="mt-2 font-serif text-2xl font-medium text-brown-900">
          Pick a date &amp; start time
        </h2>
        <p className="mt-1 text-sm text-brown-700/70">
          Enter your preferred appointment date and exact start time. Available
          therapists will appear below after the roster is checked.
        </p>
      </div>

      <div className="min-w-0 rounded-3xl border border-sand-200 bg-cream-50/90 p-4 shadow-sm sm:p-5">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label
              className="block text-sm font-medium text-brown-800"
              htmlFor="booking-date"
            >
              Select a date
            </label>
            <input
              id="booking-date"
              type="date"
              lang="en-AU"
              min={minDateKey}
              value={state.dateKey || ""}
              onChange={(event) => applyDateTime(event.target.value, timeValue)}
              className="mt-3 h-14 w-full min-w-0 max-w-full rounded-2xl border border-sand-200 bg-white px-3 text-base font-medium text-brown-900 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-200 sm:px-4"
            />
          </div>

          <div className="min-w-0">
            <label
              className="block text-sm font-medium text-brown-800"
              htmlFor="booking-time"
            >
              Enter start time
            </label>
            <input
              id="booking-time"
              type="time"
              step={900}
              value={timeValue}
              onChange={(event) => {
                const nextTime = event.target.value;
                setTimeValue(nextTime);
                if (state.dateKey) applyDateTime(state.dateKey, nextTime);
              }}
              className="mt-3 h-14 w-full min-w-0 max-w-full rounded-2xl border border-sand-200 bg-white px-3 text-base font-medium text-brown-900 outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-200 sm:px-4"
            />
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-brown-700/65">
          Please enter the time you would like to book. We will only show
          therapists and treatments that can fit that exact time.
        </p>
      </div>

      {!state.startAt ? (
        <p className="mt-6 rounded-2xl border border-dashed border-sand-200 px-4 py-7 text-center text-sm text-brown-700/60">
          Select a date and enter a start time to continue.
        </p>
      ) : null}
    </div>
  );
}
