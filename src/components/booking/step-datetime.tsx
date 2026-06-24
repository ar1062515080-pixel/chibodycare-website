"use client";

import { useEffect, useMemo, useState } from "react";
import { useBooking, ANY_PROFESSIONAL } from "@/components/booking/booking-context";
import { formatDuration, formatLongDate, formatTime } from "@/lib/format";
import type { AvailabilityResponse, AvailableSlot } from "@/lib/booking-api";
import { cn } from "@/lib/cn";

function upcomingDays(count = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    return {
      date,
      dateKey,
      weekday: date.toLocaleDateString("en-AU", { weekday: "short" }),
    };
  });
}

export function StepDateTime() {
  const { state, dispatch, derived, bookingLocations } = useBooking();
  const [availability, setAvailability] = useState<AvailabilityResponse>({
    slots: [],
    hasRoster: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const days = useMemo(() => upcomingDays(), []);
  const selectedDay = days.find((day) => day.dateKey === state.dateKey);
  const serviceId = state.serviceIds[0];

  useEffect(() => {
    if (!state.dateKey || !serviceId) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      locationId: state.locationId,
      serviceId,
      date: state.dateKey,
    });
    if (state.professionalId && state.professionalId !== ANY_PROFESSIONAL) {
      params.set("therapistId", state.professionalId);
    }

    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
        return fetch(`/api/availability?${params}`, { signal: controller.signal });
      })
      .then(async (response) => {
        const body = (await response.json()) as AvailabilityResponse & { error?: string };
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
  }, [serviceId, state.dateKey, state.locationId, state.professionalId]);

  const groupedSlots = useMemo(() => {
    const byTime = new Map<string, AvailableSlot[]>();
    availability.slots.forEach((slot) => {
      byTime.set(slot.time, [...(byTime.get(slot.time) ?? []), slot]);
    });
    return Array.from(byTime.entries());
  }, [availability.slots]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium text-brown-900">
          Pick a date & time
        </h2>
        <p className="mt-1 text-sm text-brown-700/70">
          Live times come from each studio&apos;s daily therapist roster. Your
          visit will run for {formatDuration(derived.totalDuration)}.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="booking-location" className="mb-1.5 block text-sm font-medium text-brown-800">
          Studio location
        </label>
        <select
          id="booking-location"
          value={state.locationId}
          onChange={(event) => dispatch({ type: "SET_LOCATION", locationId: event.target.value })}
          className="w-full rounded-2xl border border-sand-200 bg-cream-50 px-4 py-3 text-sm text-brown-900 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-200 sm:max-w-sm"
        >
          {bookingLocations.map((location) => (
            <option key={location.id} value={location.id}>{location.name}</option>
          ))}
        </select>
      </div>

      <p className="mb-2 text-sm font-medium text-brown-800">Select a day</p>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((day) => {
          const selected = state.dateKey === day.dateKey;
          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => dispatch({ type: "SET_DATE", dateKey: day.dateKey })}
              className={cn(
                "flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-3 transition-all",
                selected
                  ? "border-sage-500 bg-sage-600 text-cream-50 shadow-sm"
                  : "border-sand-200 bg-cream-50 text-brown-800 hover:border-sage-300",
              )}
            >
              <span className={cn("text-[0.65rem] uppercase tracking-wide", selected ? "text-cream-50/80" : "text-brown-700/60")}>{day.weekday}</span>
              <span className="mt-1 text-lg font-semibold">{day.date.getDate()}</span>
              <span className={cn("text-[0.6rem]", selected ? "text-cream-50/80" : "text-brown-700/50")}>{day.date.toLocaleDateString("en-AU", { month: "short" })}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {!selectedDay ? (
          <p className="rounded-2xl border border-dashed border-sand-200 px-4 py-8 text-center text-sm text-brown-700/60">Select a day to see available times.</p>
        ) : loading ? (
          <p className="rounded-2xl border border-sand-100 bg-sand-50 px-4 py-8 text-center text-sm text-brown-700/70">Checking the daily roster…</p>
        ) : error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">{error}</p>
        ) : groupedSlots.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-sand-200 px-4 py-8 text-center text-sm text-brown-700/70">
            {availability.message || "No online availability for this date. Please call the store to book."}
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-brown-800">Available times · {formatLongDate(selectedDay.date)}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {groupedSlots.map(([time, candidates]) => {
                const slot = candidates[0];
                const selected = state.startAt === slot.startAt;
                const therapistLabel = slot.therapistName || "Available therapist";
                return (
                  <button
                    key={`${time}-${slot.therapistId}`}
                    type="button"
                    onClick={() => dispatch({
                      type: "SELECT_SLOT",
                      time,
                      startAt: slot.startAt,
                      dailyRosterId: slot.dailyRosterId,
                      professionalId: slot.therapistId || ANY_PROFESSIONAL,
                      professionalName: slot.therapistName,
                    })}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition-all",
                      selected
                        ? "border-sage-500 bg-sage-600 text-cream-50 shadow-sm"
                        : "border-sand-200 bg-cream-50 text-brown-800 hover:border-sage-300",
                    )}
                  >
                    <span className="block text-sm font-semibold">{formatTime(time)}</span>
                    <span className={cn("mt-0.5 block truncate text-[0.65rem]", selected ? "text-cream-50/80" : "text-brown-700/60")}>{therapistLabel}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
