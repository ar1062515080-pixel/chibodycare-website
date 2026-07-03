"use client";

import { useBooking, ANY_PROFESSIONAL } from "@/components/booking/booking-context";
import { formatDuration, formatPrice, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function BookingSummaryContent() {
  const { state, derived, bookingLocations } = useBooking();
  const { selectedServices, totalDuration, totalPrice, selectedProfessional } =
    derived;

  const location = bookingLocations.find((l) => l.id === state.locationId);

  const professionalLabel =
    state.professionalId === ANY_PROFESSIONAL
      ? "Any professional"
      : (selectedProfessional?.name ?? "Not selected yet");

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <h3 className="font-serif text-lg font-medium text-brown-900">
          Booking summary
        </h3>
      </div>

      {location ? (
        <p className="mt-1 text-xs text-brown-700/60">{location.name}</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {selectedServices.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-sand-200 px-4 py-5 text-center text-sm text-brown-700/60">
            No treatments selected yet.
          </p>
        ) : (
          selectedServices.map((service) => (
            <div
              key={service.id}
              className="flex items-start justify-between gap-3 border-b border-sand-100 pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-brown-900">
                  {service.name}
                </p>
                <p className="text-xs text-brown-700/60">
                  {formatDuration(service.durationMinutes)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-brown-900">
                {formatPrice(service.price)}
              </p>
            </div>
          ))
        )}
      </div>

      {state.step >= 2 ? (
        <dl className="mt-4 space-y-2 border-t border-sand-100 pt-4 text-sm">
          {state.dateKey ? (
            <div className="flex justify-between gap-3">
              <dt className="text-brown-700/60">Date</dt>
              <dd className="text-right font-medium text-brown-900">
                {formatDateKey(state.dateKey)}
              </dd>
            </div>
          ) : null}
          {state.time ? (
            <div className="flex justify-between gap-3">
              <dt className="text-brown-700/60">Time</dt>
              <dd className="text-right font-medium text-brown-900">
                {formatTime(state.time)}
              </dd>
            </div>
          ) : null}
          {state.step >= 3 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-brown-700/60">Professional</dt>
              <dd className="text-right font-medium text-brown-900">
                {professionalLabel}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {selectedServices.length > 0 ? (
        <div className="mt-4 space-y-1.5 border-t border-sand-100 pt-4">
          <div className="flex justify-between text-sm text-brown-700/70">
            <span>Duration</span>
            <span>{formatDuration(totalDuration)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-brown-900">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Desktop sticky sidebar. */
export function BookingSummarySidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "hidden lg:block",
        className,
      )}
    >
      <div className="sticky top-28 rounded-3xl border border-sand-100 bg-cream-50 p-6 shadow-sm">
        <BookingSummaryContent />
      </div>
    </aside>
  );
}

/** Mobile collapsible-style summary card. */
export function BookingSummaryMobile() {
  const { state } = useBooking();
  if (!state.locationId) return null;

  return (
    <div className="rounded-3xl border border-sand-100 bg-cream-50 p-5 shadow-sm lg:hidden">
      <BookingSummaryContent />
    </div>
  );
}
