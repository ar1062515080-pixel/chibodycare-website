import { getFeaturedServices } from "@/lib/services";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";

export function FeaturedServices() {
  const featured = getFeaturedServices();

  return (
    <section className="bg-sand-50/60 py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Guest Favourites"
          title="Featured treatments"
          description="Our most-loved sessions, chosen by clients across Adelaide."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((service) => (
            <ServiceCard key={service.id} service={service} showCategory />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button href="/services" variant="outline" size="md">
            View full treatment menu
          </Button>
        </div>
      </div>
    </section>
  );
}
