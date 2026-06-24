"use client";

import { cn } from "@/lib/cn";
import { useBooking } from "@/components/booking/booking-context";

const steps = [
  { id: 1, label: "Treatments" },
  { id: 2, label: "Professional" },
  { id: 3, label: "Date & time" },
  { id: 4, label: "Your details" },
  { id: 5, label: "Confirmation" },
] as const;

export function StepIndicator() {
  const { state, dispatch } = useBooking();
  const current = state.step;
  const isConfirmed = Boolean(state.reference);

  return (
    <nav aria-label="Booking progress">
      {/* Desktop / tablet: full labelled stepper */}
      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const completed = step.id < current;
          const active = step.id === current;
          const canNavigate = step.id < current && !isConfirmed;

          return (
            <li
              key={step.id}
              className={cn("flex items-center", index < steps.length - 1 && "flex-1")}
            >
              <button
                type="button"
                disabled={!canNavigate}
                onClick={() =>
                  canNavigate &&
                  dispatch({ type: "GO_TO_STEP", step: step.id })
                }
                className={cn(
                  "flex items-center gap-2.5 rounded-full",
                  canNavigate && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    active &&
                      "border-sage-600 bg-sage-600 text-cream-50 shadow-sm",
                    completed &&
                      "border-sage-600 bg-sage-100 text-sage-700",
                    !active &&
                      !completed &&
                      "border-sand-200 bg-cream-50 text-brown-700/50",
                  )}
                >
                  {completed ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    active ? "text-brown-900" : "text-brown-700/60",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    "mx-3 h-px flex-1 transition-colors",
                    completed ? "bg-sage-400" : "bg-sand-200",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-brown-900">
            {steps[current - 1]?.label}
          </p>
          <p className="text-xs text-brown-700/60">
            Step {current} of {steps.length}
          </p>
        </div>
        <div className="mt-2 flex gap-1.5">
          {steps.map((step) => (
            <span
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                step.id <= current ? "bg-sage-500" : "bg-sand-200",
              )}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
