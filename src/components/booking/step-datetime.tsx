"use client";

import { useMemo } from "react";
import { useBooking } from "@/components/booking/booking-context";
import { getBookableDays, generateTimeSlots } from "@/lib/scheduling";
import { formatDuration, formatLongDate, formatTime } from "@/lib/format";
import { locations } from "@/lib/business";
import { cn } from "@/lib/cn";

export function StepDateTime() {
  const { state, dispatch, derived } = useBooking();
  const { totalDuration } = derived;

  const days = useMemo(
    () => getBookableDays(totalDuration),
    [totalDuration],
  );

  const selectedDay = days.find((day) => day.dateKey === state.dateKey);

  const slots = useMemo(() => {
    if (!selectedDay) return [];
    return generateTimeSlots(selectedDay.date, totalDuration);
  }, [selectedDay, totalDuration]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium text-brown-900">
          Pick a date & time
        </h2>
        <p className="mt-1 text-sm text-brown-700/70">
          Choose a studio, then select a day and an available time. Your visit
          will run for {formatDuration(totalDuration)}.
        </p>
      </div>

      {/* Location selector */}
      <div className="mb-6">
        <label
          htmlFor="booking-location"
          className="mb-1.5 block text-sm font-medium text-brown-800"
        >
          Studio location
        </label>
        <select
          id="booking-location"
          value={state.locationId}
          onChange={(event) =>
            dispatch({ type: "SET_LOCATION", locationId: event.target.value })
          }
          className="w-full rounded-2xl border border-sand-200 bg-cream-50 px-4 py-3 text-sm text-brown-900 outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-200 sm:max-w-sm"
        >
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      {/* Day picker */}
      <div>
        <p className="mb-2 text-sm font-medium text-brown-800">Select a day</p>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((day) => {
            const selected = state.dateKey === day.dateKey;
            const disabled = !day.hasAvailability;
            return (
              <button
                key={day.dateKey}
                type="button"
                disabled={disabled}
                onClick={() =>
                  dispatch({ type: "SET_DATE", dateKey: day.dateKey })
                }
                className={cn(
                  "flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-3 transition-all",
                  selected
                    ? "border-sage-500 bg-sage-600 text-cream-50 shadow-sm"
                    : "border-sand-200 bg-cream-50 text-brown-800 hover:border-sage-300",
                  disabled &&
                    "cursor-not-allowed opacity-40 hover:border-sand-200",
                )}
              >
                <span
                  className={cn(
                    "text-[0.65rem] uppercase tracking-wide",
                    selected ? "text-cream-50/80" : "text-brown-700/60",
                  )}
                >
                  {day.weekday}
                </span>
                <span className="mt-1 text-lg font-semibold">
                  {day.date.getDate()}
                </span>
                <span
                  className={cn(
                    "text-[0.6rem]",
                    selected ? "text-cream-50/80" : "text-brown-700/50",
                  )}
                >
                  {day.date.toLocaleDateString("en-AU", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div className="mt-6">
        {!selectedDay ? (
          <p className="rounded-2xl border border-dashed border-sand-200 px-4 py-8 text-center text-sm text-brown-700/60">
            Select a day to see available times.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-brown-800">
              Available times · {formatLongDate(selectedDay.date)}
            </p>
            {slots.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-sand-200 px-4 py-8 text-center text-sm text-brown-700/60">
                No times available for this day — please choose another.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.map((slot) => {
                  const selected = state.time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() =>
                        dispatch({ type: "SET_TIME", time: slot.time })
                      }
                      className={cn(
                        "rounded-xl border px-2 py-2.5 text-sm font-medium transition-all",
                        selected
                          ? "border-sage-500 bg-sage-600 text-cream-50 shadow-sm"
                          : "border-sand-200 bg-cream-50 text-brown-800 hover:border-sage-300",
                        !slot.available &&
                          "cursor-not-allowed text-brown-700/30 line-through hover:border-sand-200",
                      )}
                    >
                      {formatTime(slot.time)}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
