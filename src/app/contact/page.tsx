import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "@/components/contact-form";
import { business, locations } from "@/lib/business";

export const metadata: Metadata = {
  title: "Contact & Locations",
  description:
    "Get in touch with Chi Body Care. Find studio details, opening hours and all 13 Adelaide locations, or send us a message.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Questions about a treatment or booking? Reach out, or visit one of our 13 studios across Adelaide."
      />

      <section className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Contact form */}
          <div>
            <h2 className="font-serif text-2xl font-medium text-brown-900">
              Send us a message
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brown-700/80">
              Fill in the form below and our team will get back to you shortly.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          {/* Studio details */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-sand-100 bg-cream-50 p-6 shadow-sm">
              <h3 className="font-serif text-xl font-medium text-brown-900">
                Get in touch
              </h3>
              <dl className="mt-4 text-sm">
                <div className="flex items-center gap-3">
                  <dt className="text-brown-700/60">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${business.email}`}
                      className="font-medium text-sage-700 transition-colors hover:text-sage-600"
                    >
                      {business.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* All locations */}
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-medium text-brown-900">
            Our locations
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brown-700/80">
            {locations.length} studios across Adelaide — find the one nearest
            you.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <div
                key={location.id}
                className="rounded-3xl border border-sand-100 bg-cream-50 p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="font-serif text-lg font-medium text-brown-900">
                  {location.name}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold-dark">
                  {location.area}
                </p>
                <a
                  href={`tel:${location.phone.replace(/\s/g, "")}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-sage-700 transition-colors hover:text-sage-600"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 5.5C3 4.7 3.7 4 4.5 4H7l1.5 4-2 1.5a12 12 0 005 5l1.5-2 4 1.5v2.5c0 .8-.7 1.5-1.5 1.5A15.5 15.5 0 013 5.5z"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {location.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
