import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { TeamCard } from "@/components/team-card";
import { Button } from "@/components/ui/button";
import { staff } from "@/lib/staff";
import { business } from "@/lib/business";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Discover the Chi Body Care story — our philosophy, our values and the experienced practitioners behind Adelaide's destination for restorative wellness.",
};

const values = [
  {
    icon: "🌿",
    title: "Balance",
    description:
      "We treat the whole person — body, mind and energy — to restore lasting balance.",
  },
  {
    icon: "🤝",
    title: "Care",
    description:
      "Every guest is welcomed with warmth, respect and genuine attention to their needs.",
  },
  {
    icon: "✨",
    title: "Excellence",
    description:
      "Skilled, accredited practitioners and beautiful spaces, delivered consistently.",
  },
  {
    icon: "🍵",
    title: "Tradition",
    description:
      "We honour the time-tested wisdom of traditional Chinese medicine in everything we do.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-cream-100" aria-hidden="true">
        <Image src="/images/studio/about-massage-background.png" alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
      </div>
      <div className="absolute inset-0 -z-10 bg-cream-50/35" aria-hidden="true" />

      <div className="bg-cream-50/60 backdrop-blur-[1px]"><PageHero
        eyebrow="Our Story"
        title="Where ancient wisdom meets modern care"
        description={`${business.name} was founded on a simple belief — that everyone deserves a place to slow down, restore and reconnect with their wellbeing.`}
      /></div>

      {/* Brand story */}
      <section className="container-page py-16">
        <div className="grid items-center gap-12 rounded-[2rem] border border-cream-50/80 bg-cream-50/82 p-6 shadow-[0_18px_50px_rgba(39,30,23,.08)] backdrop-blur-sm sm:p-10 lg:grid-cols-2">
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-sand-200 bg-gradient-to-br from-sage-200 via-sand-100 to-champagne shadow-lg">
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-cream-50/80 font-serif text-4xl text-sage-600 shadow-md">
                  氣
                </span>
                <p className="font-serif text-2xl text-brown-900">
                  {business.tagline}
                </p>
              </div>
            </div>
          </div>
          <div>
            <SectionHeading
              align="left"
              eyebrow="The Chi Body Care way"
              title="A sanctuary for restorative wellness"
            />
            <div className="mt-5 space-y-4 text-base leading-relaxed text-brown-700/85">
              <p>
                What began as a single studio has grown into a network of 13
                wellness spaces across Adelaide — each one a calm escape from
                the pace of everyday life.
              </p>
              <p>
                Our approach blends the time-honoured principles of traditional
                Chinese medicine with contemporary therapeutic techniques. From
                relaxation and remedial massage to acupuncture, foot care and
                Chinese medicine consultations, every treatment is tailored to
                help you feel balanced and renewed.
              </p>
              <p>
                We&apos;re proud to be a trusted part of the Adelaide community,
                welcoming thousands of guests each year into our care.
              </p>
            </div>
            <div className="mt-8">
              <Button href="/book" variant="primary">
                Book a treatment
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-sand-50/70 py-16 backdrop-blur-sm">
        <div className="container-page">
          <SectionHeading
            eyebrow="What we value"
            title="The principles behind every treatment"
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-3xl border border-sand-100 bg-cream-50 p-6 text-center shadow-sm"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-50 text-2xl">
                  {value.icon}
                </span>
                <h3 className="mt-4 font-serif text-lg font-medium text-brown-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brown-700/80">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Therapist profiles */}
      <section className="container-page my-16 rounded-[2rem] border border-cream-50/80 bg-cream-50/82 py-16 shadow-[0_18px_50px_rgba(39,30,23,.08)] backdrop-blur-sm">
        <SectionHeading
          eyebrow="Our Practitioners"
          title="Meet the team caring for you"
          description="Experienced, accredited and genuinely passionate about your wellbeing."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <TeamCard key={member.id} member={member} detailed />
          ))}
        </div>
      </section>
    </main>
  );
}
