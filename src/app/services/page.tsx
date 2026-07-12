import type { Metadata } from "next";
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
    <main
      className="relative bg-cream-100 bg-cover bg-center bg-fixed"
      style={{
        backgroundImage:
          "linear-gradient(rgba(250, 247, 240, 0.6), rgba(250, 247, 240, 0.6)), url('/images/studio/botanical-wall-services.png')",
      }}
    >
      <PageHero
        eyebrow="Treatment Menu"
        title="Treatments for body & mind"
        description="Browse our full menu of restorative treatments. Every session can be booked online in minutes."
      >
        <Button href="/book" variant="primary" size="md">
          Start booking
        </Button>
      </PageHero>

      <div className="container-page pb-10 pt-12 sm:pb-16 sm:pt-16">
        <TreatmentMenu groups={grouped} />
      </div>
    </main>
  );
}
