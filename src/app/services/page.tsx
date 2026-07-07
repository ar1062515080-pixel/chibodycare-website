import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import { getServicesGroupedByCategory } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { TreatmentMenu } from "@/components/treatment-menu";

export const metadata: Metadata = {
  title: "Treatment Menu",
  description:
    "Explore the full Chi Body Care treatment menu — relaxation & remedial massage, acupuncture, foot care, aromatherapy, deep recovery, Chinese medicine, cupping and more.",
};

export default function ServicesPage() {
  const priority: Record<string, number> = { relaxation: 0, "remedial-pregnancy": 1, "foot-care": 2 };
  const grouped = getServicesGroupedByCategory().sort((a, b) => (priority[a.category.id] ?? 99) - (priority[b.category.id] ?? 99));

  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-cream-100" aria-hidden="true">
        <Image src="/images/studio/botanical-wall-services.png" alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
      </div>
      <PageHero
        eyebrow="Treatment Menu"
        title="Treatments for body & mind"
        description="Browse our full menu of restorative treatments. Every session can be booked online in minutes."
      >
        <Button href="/book" variant="primary" size="md">
          Start booking
        </Button>
      </PageHero>

      <div className="container-page pb-0 pt-12 sm:pt-16">
        <TreatmentMenu groups={grouped} />
      </div>
    </main>
  );
}
