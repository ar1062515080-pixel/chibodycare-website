"use client";

import {
  useBooking,
  ANY_PROFESSIONAL,
} from "@/components/booking/booking-context";
import { cn } from "@/lib/cn";

export function StepProfessional() {
  const { state, dispatch } = useBooking();

  const selectProfessional = (id: string) =>
    dispatch({ type: "SET_PROFESSIONAL", professionalId: id });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium text-brown-900">
          Choose your professional
        </h2>
        <p className="mt-1 text-sm text-brown-700/70">
          Daily teams vary by studio. Choose maximum availability now; any
          public therapist choices will appear with live times on the next step.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Any professional option */}
        <button
          type="button"
          onClick={() => selectProfessional(ANY_PROFESSIONAL)}
          aria-pressed={state.professionalId === ANY_PROFESSIONAL}
          className={cn(
            "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all sm:col-span-2",
            state.professionalId === ANY_PROFESSIONAL
              ? "border-sage-500 bg-sage-50 shadow-sm"
              : "border-sand-200 bg-cream-50 hover:border-sage-300",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sage-300 to-sage-500 text-cream-50">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>
          <span>
            <span className="block text-sm font-medium text-brown-900">
              Any professional
            </span>
            <span className="block text-xs text-brown-700/70">
              Maximum availability — we&apos;ll match you with the best
              practitioner.
            </span>
          </span>
        </button>

      </div>
    </div>
  );
}
