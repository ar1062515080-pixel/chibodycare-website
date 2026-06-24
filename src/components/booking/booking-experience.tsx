"use client";

import { BookingProvider } from "@/components/booking/booking-context";
import type { BookingLocation } from "@/components/booking/booking-context";
import { BookingFlow } from "@/components/booking/booking-flow";

export function BookingExperience({
  initialServiceIds,
  initialLocations,
}: {
  initialServiceIds: string[];
  initialLocations: BookingLocation[];
}) {
  return (
    <BookingProvider initialServiceIds={initialServiceIds} initialLocations={initialLocations}>
      <BookingFlow />
    </BookingProvider>
  );
}
