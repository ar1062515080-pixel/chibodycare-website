"use client";

import { useBooking } from "@/components/booking/booking-context";
import { getServicesGroupedByCategory } from "@/lib/services";
import { formatDuration, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export function StepTreatments() {
  const { state, dispatch } = useBooking();
  const grouped = getServicesGroupedByCategory();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium text-brown-900">
          Choose your treatments
        </h2>
        <p className="mt-1 text-sm text-brown-700/70">
          Select one treatment for this appointment. Additional treatments can
          be booked separately.
        </p>
      </div>

      <div className="space-y-8">
        {grouped.map(({ category, services }) => (
          <section key={category.id}>
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{category.icon}</span>
              <h3 className="font-serif text-lg font-medium text-brown-900">
                {category.name}
              </h3>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const selected = state.serviceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "TOGGLE_SERVICE",
                        serviceId: service.id,
                      })
                    }
                    aria-pressed={selected}
                    className={cn(
                      "group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                      selected
                        ? "border-sage-500 bg-sage-50 shadow-sm"
                        : "border-sand-200 bg-cream-50 hover:border-sage-300",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        selected
                          ? "border-sage-600 bg-sage-600 text-cream-50"
                          : "border-sand-300 bg-cream-50",
                      )}
                    >
                      {selected ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-brown-900">
                          {service.name}
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-brown-900">
                          {formatPrice(service.price)}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-brown-700/70">
                        {service.description}
                      </span>
                      <span className="mt-2 inline-block text-xs font-medium text-sage-700">
                        {formatDuration(service.durationMinutes)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
