import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { ServiceCard } from "@/components/service-card";
import { getServicesGroupedByCategory } from "@/lib/services";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Treatment Menu",
  description:
    "Explore the full Chi Body Care treatment menu — relaxation & remedial massage, acupuncture, foot care, aromatherapy, deep recovery, Chinese medicine, cupping and more.",
};

export default function ServicesPage() {
  const grouped = getServicesGroupedByCategory();

  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-cream-100" aria-hidden="true">
        <Image src="/images/studio/botanical-wall-services.png" alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
      </div>
      <div className="absolute inset-0 -z-10 bg-cream-50/35" aria-hidden="true" />

      <div className="bg-cream-50/60 backdrop-blur-[1px]"><PageHero
        eyebrow="Treatment Menu"
        title="Treatments for body & mind"
        description="Browse our full menu of restorative treatments. Every session can be booked online in minutes."
      >
        <Button href="/book" variant="primary" size="md">
          Start booking
        </Button>
      </PageHero></div>

      {/* Category anchor navigation */}
      <nav
        aria-label="Treatment categories"
        className="sticky top-20 z-30 border-b border-sand-100 bg-cream-50/85 backdrop-blur-md"
      >
        <div className="container-page">
          <ul className="no-scrollbar flex gap-2 overflow-x-auto py-3">
            {grouped.map(({ category }) => (
              <li key={category.id}>
                <Link
                  href={`#${category.id}`}
                  className="inline-flex whitespace-nowrap rounded-full border border-sand-200 bg-cream-50 px-4 py-1.5 text-sm font-medium text-brown-800 transition-colors hover:border-sage-300 hover:text-sage-700"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="container-page space-y-10 py-16">
        {grouped.map(({ category, services }) => (
          <section key={category.id} id={category.id} className="scroll-mt-40 rounded-[2rem] border border-cream-50/80 bg-cream-50/82 p-6 shadow-[0_18px_50px_rgba(39,30,23,.08)] backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-3 border-b border-sand-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sage-50 text-2xl">
                  {category.icon}
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-medium text-brown-900 sm:text-3xl">
                    {category.name}
                  </h2>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-brown-700/80">
                    {category.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
