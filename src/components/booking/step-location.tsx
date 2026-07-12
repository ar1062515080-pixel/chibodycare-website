"use client";

import { useBooking } from "@/components/booking/booking-context";
import { cn } from "@/lib/cn";

export function StepLocation() {
  const { state, dispatch, bookingLocations } = useBooking();
  const selectLocation = (locationId: string) => {
    dispatch({ type: "SET_LOCATION", locationId });
    dispatch({ type: "NEXT" });
  };
  return <div>
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">Step one</p>
      <h2 className="mt-2 font-serif text-2xl font-medium text-brown-900">Choose your studio</h2>
      <p className="mt-1 text-sm text-brown-700/70">Select the Chi Body Care location you would like to visit.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {bookingLocations.map((location) => {
        const selected = state.locationId === location.id;
        return <button key={location.id} type="button" onClick={() => selectLocation(location.id)} aria-pressed={selected} className={cn("rounded-2xl border p-4 text-left transition-all", selected ? "border-gold-dark bg-champagne/45 shadow-sm" : "border-sand-200 bg-cream-50 hover:border-gold-light")}>
          <span className="block font-serif text-lg text-brown-900">{location.name}</span>
          <span className="mt-1 block text-xs text-brown-700/65">{location.phone}</span>
        </button>;
      })}
    </div>
  </div>;
}
