"use client";

import { BookingProvider } from "@/components/booking/booking-context";
import { BookingFlow } from "@/components/booking/booking-flow";

export function BookingExperience({
  initialServiceIds,
}: {
  initialServiceIds: string[];
}) {
  return (
    <BookingProvider initialServiceIds={initialServiceIds}>
      <BookingFlow />
    </BookingProvider>
  );
}
