"use client";

import { useRouter } from "next/navigation";

type Location = { id: string; name: string };

export function LocationFilter({ locations, value, label }: { locations: Location[]; value: string; label: string }) {
  const router = useRouter();
  return (
    <label className="block max-w-lg">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-dark">{label}</span>
      <span className="relative mt-2 block">
        <select
          value={value}
          onChange={(event) => router.push(`/admin/therapists?location=${encodeURIComponent(event.target.value)}`)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-sand-200 bg-cream-50 py-2.5 pl-3.5 pr-10 text-sm font-medium text-brown-900 outline-none transition hover:border-gold-light focus:border-gold-dark focus:ring-2 focus:ring-gold-light/25"
        >
          {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </select>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gold-dark">
          <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}
