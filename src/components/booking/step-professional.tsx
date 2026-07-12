"use client";

import { useEffect, useState } from "react";
import { ANY_PROFESSIONAL, useBooking } from "@/components/booking/booking-context";
import { cn } from "@/lib/cn";

type Professional = { id: string; name: string; serviceIds: string[] };
type SlotOptions = { professionals: Professional[]; serviceIds: string[] };

export function StepProfessional() {
  const { state, dispatch } = useBooking();
  const [options, setOptions] = useState<SlotOptions>({ professionals: [], serviceIds: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.locationId || !state.startAt) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ locationId: state.locationId, startAt: state.startAt });
    Promise.resolve()
      .then(() => { setLoading(true); setError(null); return fetch(`/api/slot-options?${params}`, { signal: controller.signal }); })
      .then(async (response) => {
        const body = (await response.json()) as SlotOptions & { error?: string };
        if (!response.ok) throw new Error(body.error || "Unable to load professionals.");
        return body;
      })
      .then(setOptions)
      .catch((caught: unknown) => { if ((caught as Error).name !== "AbortError") setError((caught as Error).message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [state.locationId, state.startAt]);

  const select = (id: string, name: string | null = null) => dispatch({ type: "SET_PROFESSIONAL", professionalId: id, professionalName: name });
  const cardClass = (selected: boolean) => cn("flex items-center gap-4 rounded-2xl border p-4 text-left transition-all", selected ? "border-sage-500 bg-sage-50 shadow-sm" : "border-sand-200 bg-cream-50 hover:border-sage-300");

  return <div>
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">Available at your time</p>
      <h2 className="mt-2 font-serif text-2xl font-medium text-brown-900">Choose your professional</h2>
      <p className="mt-1 text-sm text-brown-700/70">Only therapists rostered and free at your selected studio and time are shown.</p>
    </div>
    {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border border-sand-100 p-8 text-sm text-brown-700/65"><span className="size-4 animate-spin rounded-full border-2 border-sage-600 border-r-transparent" />Loading available therapists&hellip;</div>
      : error ? <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      : options.serviceIds.length === 0 ? <p className="rounded-2xl border border-dashed border-sand-200 p-6 text-center text-sm text-brown-700/65">This time has just become unavailable. Please go back and choose another time.</p>
      : <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => select(ANY_PROFESSIONAL)} aria-pressed={state.professionalId === ANY_PROFESSIONAL} className={cn(cardClass(state.professionalId === ANY_PROFESSIONAL), "sm:col-span-2")}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sage-300 to-sage-500 text-xl text-white">✦</span>
          <span><span className="block text-sm font-medium text-brown-900">Any professional</span><span className="block text-xs text-brown-700/70">We&apos;ll assign any qualified therapist who is still available.</span></span>
        </button>
        {options.professionals.map((professional) => <button key={professional.id} type="button" onClick={() => select(professional.id, professional.name)} aria-pressed={state.professionalId === professional.id} className={cardClass(state.professionalId === professional.id)}><span className="flex h-12 w-12 items-center justify-center rounded-full bg-champagne font-serif text-lg text-brown-900">{professional.name.slice(0, 1).toUpperCase()}</span><span><span className="block text-sm font-medium text-brown-900">{professional.name}</span><span className="block text-xs text-brown-700/65">{professional.serviceIds.length} available treatment options</span></span></button>)}
        {options.professionals.length === 0 ? <p className="sm:col-span-2 rounded-2xl border border-dashed border-sand-200 p-5 text-center text-sm text-brown-700/65">Therapists are available, but their names are private. Choose Any professional to continue.</p> : null}
      </div>}
  </div>;
}
