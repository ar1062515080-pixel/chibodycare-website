"use client";

import { useEffect, useMemo, useState } from "react";
import { ANY_PROFESSIONAL, useBooking } from "@/components/booking/booking-context";
import { categories, getServiceById, getServicesByCategory, type CategoryId } from "@/lib/services";
import { formatDuration, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

type Professional = { id: string; name: string; serviceIds: string[] };
type SlotOptions = { professionals: Professional[]; serviceIds: string[] };

export function StepTreatments() {
  const { state, dispatch } = useBooking();
  const currentService = state.serviceIds[0] ? getServiceById(state.serviceIds[0]) : undefined;
  const [categoryId, setCategoryId] = useState<CategoryId | null>(currentService?.categoryId ?? null);
  const [slotOptions, setSlotOptions] = useState<SlotOptions | null>(null);
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
        if (!response.ok) throw new Error(body.error || "Unable to load treatments.");
        return body;
      })
      .then(setSlotOptions)
      .catch((caught: unknown) => { if ((caught as Error).name !== "AbortError") setError((caught as Error).message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [state.locationId, state.startAt]);

  const allowedServiceIds = useMemo(() => {
    if (!slotOptions) return new Set<string>();
    if (state.professionalId === ANY_PROFESSIONAL) return new Set(slotOptions.serviceIds);
    return new Set(slotOptions.professionals.find((item) => item.id === state.professionalId)?.serviceIds ?? []);
  }, [slotOptions, state.professionalId]);
  const visibleCategories = categories.filter((category) => getServicesByCategory(category.id).some((service) => allowedServiceIds.has(service.id)));
  const category = visibleCategories.find((item) => item.id === categoryId);
  const options = categoryId ? getServicesByCategory(categoryId).filter((service) => allowedServiceIds.has(service.id)) : [];

  const chooseCategory = (next: CategoryId) => {
    if (next !== categoryId && state.serviceIds.length) dispatch({ type: "CLEAR_SERVICE" });
    setCategoryId(next);
  };

  return <div>
    <div className="mb-6"><p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">Available treatments</p><h2 className="mt-2 font-serif text-2xl font-medium text-brown-900">What kind of treatment would you like?</h2><p className="mt-1 text-sm text-brown-700/70">Choose a category, then select a treatment that fits your chosen time and professional.</p></div>
    {loading ? <div className="flex items-center justify-center gap-3 rounded-2xl border border-sand-100 p-8 text-sm text-brown-700/65"><span className="size-4 animate-spin rounded-full border-2 border-sage-600 border-r-transparent" />Loading available treatments&hellip;</div>
      : error ? <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      : visibleCategories.length === 0 ? <p className="rounded-2xl border border-dashed border-sand-200 p-6 text-center text-sm text-brown-700/65">No treatments remain available for this selection. Please go back and choose another professional or time.</p>
      : <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleCategories.map((item) => <button key={item.id} type="button" onClick={() => chooseCategory(item.id)} aria-pressed={categoryId === item.id} className={cn("rounded-2xl border p-4 text-left transition-all", categoryId === item.id ? "border-sage-500 bg-sage-50 shadow-sm" : "border-sand-200 bg-cream-50 hover:border-sage-300")}><span className="block font-serif text-lg text-brown-900">{item.name}</span><span className="mt-1 block text-xs text-brown-700/65">{item.tagline}</span></button>)}</div>
        {category ? <div className="mt-7 rounded-2xl border border-gold-light/50 bg-champagne/20 p-5">
          <label htmlFor="treatment-duration" className="block text-sm font-medium text-brown-900">{category.name} · treatment and duration</label>
          <select id="treatment-duration" value={currentService?.categoryId === categoryId ? currentService.id : ""} onChange={(event) => event.target.value && dispatch({ type: "TOGGLE_SERVICE", serviceId: event.target.value })} className="mt-2 w-full rounded-xl border border-sand-200 bg-cream-50 px-4 py-3 text-sm text-brown-900 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-200">
            <option value="">Select a treatment and duration</option>
            {options.map((service) => <option key={service.id} value={service.id}>{service.name} · {formatDuration(service.durationMinutes)} · {formatPrice(service.price)}</option>)}
          </select>
          {currentService?.categoryId === categoryId ? <div className="mt-4 flex items-start justify-between gap-4 rounded-xl bg-cream-50 p-4"><div><p className="text-sm font-medium text-brown-900">{currentService.name}</p><p className="mt-1 text-xs leading-relaxed text-brown-700/65">{currentService.description}</p></div><p className="shrink-0 font-medium text-brown-900">{formatPrice(currentService.price)}</p></div> : null}
        </div> : null}
      </>}
  </div>;
}
