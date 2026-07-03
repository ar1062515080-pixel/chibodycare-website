"use client";

import { useEffect, useState } from "react";
import { useBooking } from "@/components/booking/booking-context";
import { StepIndicator } from "@/components/booking/step-indicator";
import { StepLocation } from "@/components/booking/step-location";
import { StepProfessional } from "@/components/booking/step-professional";
import { StepTreatments } from "@/components/booking/step-treatments";
import { StepDateTime } from "@/components/booking/step-datetime";
import { StepContact } from "@/components/booking/step-contact";
import { StepConfirmation } from "@/components/booking/step-confirmation";
import { BookingSummarySidebar, BookingSummaryMobile } from "@/components/booking/booking-summary";
import { isContactValid } from "@/components/booking/validation";

const stepHints: Record<number, string> = {
  1: "Choose a studio to continue.",
  2: "Select a day and an available time.",
  3: "Choose a professional or select Any professional.",
  4: "Choose a treatment category and duration.",
};

export function BookingFlow() {
  const { state, dispatch } = useBooking();
  const [showContactErrors, setShowContactErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [state.step]);

  const canProceed = (() => {
    switch (state.step) {
      case 1: return Boolean(state.locationId);
      case 2: return Boolean(state.dateKey && state.time);
      case 3: return state.professionalId !== null;
      case 4: return state.serviceIds.length > 0;
      case 5: return isContactValid(state.contact);
      default: return true;
    }
  })();

  const handleNext = async () => {
    if (state.step === 5) {
      if (!isContactValid(state.contact)) { setShowContactErrors(true); return; }
      const serviceId = state.serviceIds[0];
      if (!serviceId || !state.startAt) return;
      setSubmitting(true); setSubmitError(null);
      try {
        const response = await fetch("/api/bookings", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({
            customerName: `${state.contact.firstName} ${state.contact.lastName}`,
            customerPhone: state.contact.phone, customerEmail: state.contact.email,
            notes: state.contact.notes, locationId: state.locationId, serviceId,
            therapistId: state.professionalId === "any" ? null : state.professionalId,
            dailyRosterId: state.dailyRosterId, startAt: state.startAt,
          }),
        });
        const result = (await response.json()) as { reference?: string; error?: string };
        if (!response.ok || !result.reference) throw new Error(result.error || "Unable to create booking.");
        dispatch({ type: "CONFIRM", reference: result.reference });
      } catch (error) { setSubmitError((error as Error).message); }
      finally { setSubmitting(false); }
      return;
    }
    if (canProceed) dispatch({ type: "NEXT" });
  };

  const isConfirmation = state.step === 6;
  return <div className="container-page py-10 sm:py-14">
    {!isConfirmation ? <div className="mb-8 rounded-3xl border border-sand-100 bg-cream-50 p-5 shadow-sm sm:p-6"><StepIndicator /></div> : null}
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <div className="rounded-3xl border border-sand-100 bg-cream-50 p-6 shadow-sm sm:p-8">
          {state.step === 1 ? <StepLocation /> : null}
          {state.step === 2 ? <StepDateTime /> : null}
          {state.step === 3 ? <StepProfessional /> : null}
          {state.step === 4 ? <StepTreatments /> : null}
          {state.step === 5 ? <StepContact showErrors={showContactErrors} /> : null}
          {state.step === 6 ? <StepConfirmation /> : null}
        </div>
        {!isConfirmation ? <div className="mt-6 lg:hidden"><BookingSummaryMobile /></div> : null}
        {!isConfirmation ? <div className="mt-6 flex items-center justify-between gap-4">
          <button type="button" onClick={() => { setShowContactErrors(false); dispatch({ type: "BACK" }); }} disabled={state.step === 1} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-brown-800 transition-colors hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-40">← Back</button>
          <div className="flex flex-col items-end gap-1.5">
            <button type="button" onClick={handleNext} disabled={submitting || (!canProceed && state.step !== 5)} className="inline-flex items-center gap-2 rounded-full bg-sage-600 px-7 py-3 text-sm font-medium text-cream-50 shadow-sm transition-all hover:bg-sage-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Saving booking…" : state.step === 5 ? "Confirm booking" : "Continue →"}
            </button>
            {!canProceed && stepHints[state.step] ? <p className="text-xs text-brown-700/60">{stepHints[state.step]}</p> : null}
            {submitError ? <p className="max-w-xs text-right text-xs text-red-600">{submitError}</p> : null}
          </div>
        </div> : null}
      </div>
      {!isConfirmation ? <BookingSummarySidebar /> : null}
    </div>
  </div>;
}
