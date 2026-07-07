import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "@/components/contact-form";
import { locations } from "@/lib/business";

const studioHours = [
  ["Monday", "9am – 5:30pm"],
  ["Tuesday", "9am – 5:30pm"],
  ["Wednesday", "9am – 5:30pm"],
  ["Thursday", "9am – 9pm"],
  ["Friday", "9am – 5:30pm"],
  ["Saturday", "9am – 5pm"],
  ["Sunday", "11am – 5pm"],
] as const;

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
          <div>
            <h2 className="font-serif text-2xl font-medium text-brown-900">Our studios</h2>
            <p className="mt-2 text-sm leading-relaxed text-brown-700/70">Select a studio to view its phone number and opening hours.</p>
            <div className="mt-6 overflow-hidden rounded-3xl border border-sand-200 bg-cream-50/90 shadow-sm">
              {locations.map((location) => (
                <details key={location.id} className="group border-b border-sand-100 last:border-b-0">
                  <summary className="flex list-none items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-sand-50/70">
                    <span className="font-serif text-lg font-medium text-brown-900">{location.name}</span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-sand-200 text-lg font-light text-gold-dark transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="border-t border-sand-100 bg-white/55 px-5 pb-5 pt-4">
                    <a href={`tel:${location.phone.replace(/\s/g, "")}`} className="inline-flex font-medium text-sage-700 transition-colors hover:text-sage-600">{location.phone}</a>
                    <ul className="mt-4 space-y-1.5 text-xs text-brown-700/70">
                      {studioHours.map(([day, hours]) => <li key={day} className="flex justify-between gap-4"><span>{day}</span><span>{hours}</span></li>)}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
