"use client";

import { useEffect, useState } from "react";
import { ANY_PROFESSIONAL, useBooking } from "@/components/booking/booking-context";
import { cn } from "@/lib/cn";

type Professional = { id: string; name: string };

export function StepProfessional() {
  const { state, dispatch } = useBooking();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve()
      .then(() => { setLoading(true); setError(null); return fetch(`/api/professionals?locationId=${encodeURIComponent(state.locationId)}`, { signal: controller.signal }); })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to load professionals."); return body; })
      .then((body: { professionals: Professional[] }) => setProfessionals(body.professionals))
      .catch((caught: Error) => { if (caught.name !== "AbortError") setError(caught.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [state.locationId]);

  const select = (id: string, name: string | null = null) => dispatch({ type: "SET_PROFESSIONAL", professionalId: id, professionalName: name });
  const cardClass = (selected: boolean) => cn("flex items-center gap-4 rounded-2xl border p-4 text-left transition-all", selected ? "border-sage-500 bg-sage-50 shadow-sm" : "border-sand-200 bg-cream-50 hover:border-sage-300");

  return <div>
    <div className="mb-6"><p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">Your preference</p><h2 className="mt-2 font-serif text-2xl font-medium text-brown-900">Choose your professional</h2><p className="mt-1 text-sm text-brown-700/70">Select a named therapist, or choose Any professional for the widest availability.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => select(ANY_PROFESSIONAL)} aria-pressed={state.professionalId === ANY_PROFESSIONAL} className={cn(cardClass(state.professionalId === ANY_PROFESSIONAL), "sm:col-span-2")}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sage-300 to-sage-500 text-xl text-white">✦</span><span><span className="block text-sm font-medium text-brown-900">Any professional</span><span className="block text-xs text-brown-700/70">We’ll match you with an available qualified therapist.</span></span>
      </button>
      {loading ? <div className="sm:col-span-2 flex items-center justify-center gap-3 rounded-2xl border border-sand-100 p-6 text-sm text-brown-700/65"><span className="size-4 animate-spin rounded-full border-2 border-sage-600 border-r-transparent" />Loading therapists…</div> : null}
      {error ? <p className="sm:col-span-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {!loading && !error ? professionals.map((professional) => <button key={professional.id} type="button" onClick={() => select(professional.id, professional.name)} aria-pressed={state.professionalId === professional.id} className={cardClass(state.professionalId === professional.id)}><span className="flex h-12 w-12 items-center justify-center rounded-full bg-champagne font-serif text-lg text-brown-900">{professional.name.slice(0, 1).toUpperCase()}</span><span className="text-sm font-medium text-brown-900">{professional.name}</span></button>) : null}
      {!loading && !error && professionals.length === 0 ? <p className="sm:col-span-2 rounded-2xl border border-dashed border-sand-200 p-5 text-center text-sm text-brown-700/65">No named therapists are published for this studio yet. You can still choose Any professional.</p> : null}
    </div>
  </div>;
}
