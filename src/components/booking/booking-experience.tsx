"use client";

import { BookingProvider } from "@/components/booking/booking-context";
import type { BookingLocation } from "@/components/booking/booking-context";
import { BookingFlow } from "@/components/booking/booking-flow";

export function BookingExperience({
  initialServiceIds,
  initialLocations,
  bookingAvailable,
}: {
  initialServiceIds: string[];
  initialLocations: BookingLocation[];
  bookingAvailable: boolean;
}) {
  return (
    <BookingProvider initialServiceIds={initialServiceIds} initialLocations={initialLocations}>
      <BookingFlow bookingAvailable={bookingAvailable} />
    </BookingProvider>
  );
}
