"use client";

import { useRouter } from "next/navigation";

type Location = { id: string; name: string };

export function LocationFilter({ locations, value, label }: { locations: Location[]; value: string; label: string }) {
  const router = useRouter();
  return (
    <label className="block text-sm font-medium text-brown-800">
      {label}
      <select
        value={value}
        onChange={(event) => router.push(`/admin/therapists?location=${encodeURIComponent(event.target.value)}`)}
        className="mt-2 w-full rounded-2xl border border-sand-200 bg-cream-50 px-4 py-3 text-brown-900 shadow-sm sm:max-w-xl"
      >
        {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
      </select>
    </label>
  );
}
