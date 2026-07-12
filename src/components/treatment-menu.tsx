import Link from "next/link";
import type { ServicesGroupedByCategory } from "@/lib/services";
import { formatDuration, formatPrice } from "@/lib/format";

export function TreatmentMenu({ groups }: { groups: ServicesGroupedByCategory[] }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-sand-200/80 bg-cream-50/92 shadow-[0_24px_70px_rgba(39,30,23,.12)] backdrop-blur-md">
      <div className="border-b border-sand-200 px-6 py-6 sm:px-9">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold-dark">Treatment selection</p>
        <h2 className="mt-2 font-serif text-3xl text-brown-900 sm:text-4xl">Choose your treatment</h2>
        <p className="mt-2 text-sm text-brown-700/65">Select a category to view available durations and prices.</p>
      </div>
      <div className="divide-y divide-sand-200">
        {groups.map(({ category, services }, index) => (
          <details key={category.id} id={category.id} open={index === 0} className="group scroll-mt-40">
            <summary className="flex list-none items-center justify-between gap-5 px-6 py-5 transition-colors hover:bg-champagne-light/35 sm:px-9">
              <div>
                <h3 className="font-serif text-2xl text-brown-900 sm:text-[1.75rem]">{category.name}</h3>
                <p className="mt-1 text-sm text-brown-700/60">{category.tagline}</p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-sand-200 text-xl font-light text-gold-dark transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-sand-100 bg-white/55 px-6 sm:px-9">
              {services.map((service) => (
                <div key={service.id} className="grid gap-3 border-b border-sand-100 py-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
                  <div>
                    <p className="font-medium text-brown-900">{service.name}</p>
                    <p className="mt-1 text-xs leading-5 text-brown-700/55">{service.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm sm:justify-end">
                    <span className="text-brown-700/65">{formatDuration(service.durationMinutes)}</span>
                    <span className="min-w-14 text-right font-semibold text-brown-900">{formatPrice(service.price)}</span>
                  </div>
                  <Link href={`/book?service=${service.id}`} className="w-fit rounded-full border border-sage-600 px-4 py-2 text-xs font-medium text-sage-700 transition-colors hover:bg-sage-700 hover:text-cream-50">Book</Link>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
