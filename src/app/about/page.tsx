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
    icon: "01",
    title: "Balance",
    description:
      "We treat the whole person — body, mind and energy — to restore lasting balance.",
  },
  {
    icon: "02",
    title: "Care",
    description:
      "Every guest is welcomed with warmth, respect and genuine attention to their needs.",
  },
  {
    icon: "03",
    title: "Excellence",
    description:
      "Skilled practitioners and beautiful spaces, delivered with consistency.",
  },
  {
    icon: "04",
    title: "Tradition",
    description:
      "We honour the time-tested wisdom of traditional Chinese medicine in everything we do.",
  },
];

export default function AboutPage() {
  return (
    <main
      className="relative bg-cream-100 bg-cover bg-center bg-fixed"
      style={{
        backgroundImage:
          "linear-gradient(rgba(250, 247, 240, 0.5), rgba(250, 247, 240, 0.62)), url('/images/studio/about-massage-background.png')",
      }}
    >
      <PageHero
        eyebrow="Our Story"
        title="Where ancient wisdom meets modern care"
        description={`${business.name} was founded on a simple belief — that everyone deserves a place to slow down, restore and reconnect with their wellbeing.`}
        imageSrc="/images/studio/about-massage-background.png"
        imageAlt="Massage treatment at Chi Body Care"
      />

      <section className="container-page py-16">
        <div className="grid items-center gap-12 rounded-[2rem] border border-sand-200/80 bg-cream-50/92 p-6 shadow-[0_24px_70px_rgba(39,30,23,.12)] backdrop-blur-md sm:p-10 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-sand-200 shadow-lg">
              <Image src="/images/studio/studio-lounge.webp" alt="Chi Body Care studio lounge" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover object-center" />
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

      <section className="bg-sage-800/95 py-16 text-cream-50 backdrop-blur-sm">
        <div className="container-page">
          <SectionHeading
            eyebrow="What we value"
            title="The principles behind every treatment"
            className="[&_h2]:text-cream-50 [&_p]:text-gold-light"
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-3xl border border-cream-50/10 bg-cream-50/8 p-6 text-center shadow-sm backdrop-blur-sm"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-light/35 bg-brown-900/20 text-sm tracking-[0.2em] text-gold-light">
                  {value.icon}
                </span>
                <h3 className="mt-4 font-serif text-lg font-medium text-cream-50">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-100/70">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mb-16 mt-16 rounded-[2rem] border border-sand-200/80 bg-cream-50/92 py-16 shadow-[0_24px_70px_rgba(39,30,23,.12)] backdrop-blur-md sm:mb-20">
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
