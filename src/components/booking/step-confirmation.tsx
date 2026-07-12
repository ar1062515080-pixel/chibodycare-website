"use client";

import {
  useBooking,
  ANY_PROFESSIONAL,
} from "@/components/booking/booking-context";
import { Button } from "@/components/ui/button";
import {
  formatDuration,
  formatLongDate,
  formatPrice,
  formatTime,
} from "@/lib/format";

function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function StepConfirmation() {
  const { state, dispatch, derived, bookingLocations } = useBooking();
  const { selectedServices, totalDuration, totalPrice, selectedProfessional } =
    derived;

  const location = bookingLocations.find((l) => l.id === state.locationId);
  const professionalLabel =
    state.professionalId === ANY_PROFESSIONAL
      ? "Any available professional"
      : (selectedProfessional?.name ?? "—");

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-600 text-cream-50 shadow-md">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="mt-5 font-serif text-3xl font-medium text-brown-900">
        Booking confirmed
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brown-700/80">
        Thank you, {state.contact.firstName}! Your appointment is reserved. A
        confirmation has been recorded
        {state.contact.email ? ` for ${state.contact.email}` : ""}.
      </p>

      <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-2xl border border-sage-200 bg-sage-50 px-6 py-4">
        <span className="text-xs uppercase tracking-[0.18em] text-sage-700">
          Booking reference
        </span>
        <span className="mt-1 font-serif text-2xl font-semibold tracking-wider text-brown-900">
          {state.reference}
        </span>
      </div>

      {/* Receipt-style summary */}
      <div className="mx-auto mt-8 max-w-md rounded-3xl border border-sand-100 bg-cream-50 p-6 text-left shadow-sm">
        <dl className="space-y-3 text-sm">
          {state.dateKey ? (
            <div className="flex justify-between gap-4 border-b border-sand-100 pb-3">
              <dt className="text-brown-700/60">When</dt>
              <dd className="text-right font-medium text-brown-900">
                {formatLongDate(dateFromKey(state.dateKey))}
                {state.time ? ` · ${formatTime(state.time)}` : ""}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-b border-sand-100 pb-3">
            <dt className="text-brown-700/60">Where</dt>
            <dd className="text-right font-medium text-brown-900">
              {location?.name ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-sand-100 pb-3">
            <dt className="text-brown-700/60">With</dt>
            <dd className="text-right font-medium text-brown-900">
              {professionalLabel}
            </dd>
          </div>
          <div className="border-b border-sand-100 pb-3">
            <dt className="mb-2 text-brown-700/60">Treatments</dt>
            <dd className="space-y-1.5">
              {selectedServices.map((service) => (
                <div
                  key={service.id}
                  className="flex justify-between gap-3 text-brown-900"
                >
                  <span>{service.name}</span>
                  <span className="font-medium">
                    {formatPrice(service.price)}
                  </span>
                </div>
              ))}
            </dd>
          </div>
          <div className="flex justify-between text-brown-700/70">
            <dt>Total duration</dt>
            <dd>{formatDuration(totalDuration)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold text-brown-900">
            <dt>Total</dt>
            <dd>{formatPrice(totalPrice)}</dd>
          </div>
        </dl>
        <p className="mt-4 rounded-xl bg-sand-50 px-3 py-2 text-xs text-brown-700/70">
          Pay in studio after your treatment. No online payment has been taken.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button href="/" variant="outline">
          Back to home
        </Button>
        <Button
          onClick={() => dispatch({ type: "RESET" })}
          variant="primary"
        >
          Make another booking
        </Button>
      </div>
    </div>
  );
}
