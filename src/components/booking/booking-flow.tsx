"use client";

import { useEffect, useState } from "react";
import { useBooking } from "@/components/booking/booking-context";
import { StepIndicator } from "@/components/booking/step-indicator";
import { StepTreatments } from "@/components/booking/step-treatments";
import { StepProfessional } from "@/components/booking/step-professional";
import { StepDateTime } from "@/components/booking/step-datetime";
import { StepContact } from "@/components/booking/step-contact";
import { StepConfirmation } from "@/components/booking/step-confirmation";
import {
  BookingSummarySidebar,
  BookingSummaryMobile,
} from "@/components/booking/booking-summary";
import { isContactValid } from "@/components/booking/validation";

const stepHints: Record<number, string> = {
  1: "Select at least one treatment to continue.",
  2: "Choose a professional or pick “Any professional”.",
  3: "Select a day and an available time.",
};

export function BookingFlow() {
  const { state, dispatch } = useBooking();
  const [showContactErrors, setShowContactErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Scroll to the top of the flow whenever the step changes.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.step]);

  const canProceed = (() => {
    switch (state.step) {
      case 1:
        return state.serviceIds.length > 0;
      case 2:
        return state.professionalId !== null;
      case 3:
        return Boolean(state.dateKey && state.time);
      case 4:
        return isContactValid(state.contact);
      default:
        return true;
    }
  })();

  const handleNext = async () => {
    if (state.step === 4) {
      if (!isContactValid(state.contact)) {
        setShowContactErrors(true);
        return;
      }
      const serviceId = state.serviceIds[0];
      if (!serviceId || !state.startAt) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            customerName: `${state.contact.firstName} ${state.contact.lastName}`,
            customerPhone: state.contact.phone,
            customerEmail: state.contact.email,
            notes: state.contact.notes,
            locationId: state.locationId,
            serviceId,
            therapistId: state.professionalId === "any" ? null : state.professionalId,
            dailyRosterId: state.dailyRosterId,
            startAt: state.startAt,
          }),
        });
        const result = (await response.json()) as { reference?: string; error?: string };
        if (!response.ok || !result.reference) {
          throw new Error(result.error || "Unable to create booking.");
        }
        dispatch({ type: "CONFIRM", reference: result.reference });
      } catch (error) {
        setSubmitError((error as Error).message);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (canProceed) {
      dispatch({ type: "NEXT" });
    }
  };

  const handleBack = () => {
    setShowContactErrors(false);
    dispatch({ type: "BACK" });
  };

  const isConfirmation = state.step === 5;

  return (
    <div className="container-page py-10 sm:py-14">
      {!isConfirmation ? (
        <div className="mb-8 rounded-3xl border border-sand-100 bg-cream-50 p-5 shadow-sm sm:p-6">
          <StepIndicator />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="rounded-3xl border border-sand-100 bg-cream-50 p-6 shadow-sm sm:p-8">
            {state.step === 1 ? <StepTreatments /> : null}
            {state.step === 2 ? <StepProfessional /> : null}
            {state.step === 3 ? <StepDateTime /> : null}
            {state.step === 4 ? (
              <StepContact showErrors={showContactErrors} />
            ) : null}
            {state.step === 5 ? <StepConfirmation /> : null}
          </div>

          {/* Mobile summary */}
          {!isConfirmation ? (
            <div className="mt-6 lg:hidden">
              <BookingSummaryMobile />
            </div>
          ) : null}

          {/* Footer navigation */}
          {!isConfirmation ? (
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={state.step === 1}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-brown-800 transition-colors hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    d="M12 5l-5 5 5 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>

              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting || (!canProceed && state.step !== 4)}
                  className="inline-flex items-center gap-2 rounded-full bg-sage-600 px-7 py-3 text-sm font-medium text-cream-50 shadow-sm transition-all hover:bg-sage-700 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-sage-400 disabled:opacity-70"
                >
                  {submitting
                    ? "Saving booking…"
                    : state.step === 4
                      ? "Confirm booking"
                      : "Continue"}
                  {state.step !== 4 ? (
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        d="M8 5l5 5-5 5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </button>
                {!canProceed && stepHints[state.step] ? (
                  <p className="text-xs text-brown-700/60">
                    {stepHints[state.step]}
                  </p>
                ) : null}
                {submitError ? (
                  <p className="max-w-xs text-right text-xs text-red-600">{submitError}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Desktop sidebar summary */}
        {!isConfirmation ? <BookingSummarySidebar /> : null}
      </div>
    </div>
  );
}
