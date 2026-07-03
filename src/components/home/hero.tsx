import { Button } from "@/components/ui/button";
import Image from "next/image";
import { business } from "@/lib/business";
import { Stars } from "@/components/ui/stars";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative background washes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-sage-200/40 blur-3xl" />
        <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-champagne/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sand-100/60 blur-3xl" />
      </div>

      <div className="container-page grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-cream-50/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-500" />
            13 studios across Adelaide
          </span>

          <h1 className="mt-6 text-balance font-serif text-4xl font-medium leading-[1.1] text-brown-900 sm:text-5xl lg:text-6xl">
            Restore your body.
            <span className="block text-sage-600">Rebalance your energy.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-brown-700/80">
            {business.shortDescription} Book a treatment crafted to calm the
            mind, ease tension and renew your sense of wellbeing.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/book" size="lg" variant="primary">
              Book Your Treatment
            </Button>
            <Button href="/services" size="lg" variant="outline">
              Explore Services
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <Stars rating={5} />
            <p className="text-sm text-brown-700/70">
              Loved by thousands of Adelaide clients
            </p>
          </div>
        </div>

        <div className="relative animate-fade-up">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.5rem] border border-sand-200 bg-gradient-to-br from-sage-200 via-sand-100 to-champagne shadow-xl">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <Image src="/images/chi-logo.png" alt="Chi Body Care official logo" width={1024} height={1024} priority className="h-52 w-52 object-contain drop-shadow-[0_18px_28px_rgba(96,72,32,0.22)] sm:h-64 sm:w-64" />
              <p className="font-serif text-2xl text-brown-900">
                {business.tagline}
              </p>
              <p className="max-w-xs text-sm text-brown-800/70">
                A calm, restorative escape — thoughtfully designed for modern
                wellbeing.
              </p>
            </div>
          </div>

          {/* Floating stat card */}
          <div className="absolute -bottom-6 -left-2 hidden rounded-2xl border border-sand-100 bg-cream-50 p-4 shadow-lg sm:block">
            <p className="font-serif text-2xl font-semibold text-sage-600">
              20+
            </p>
            <p className="text-xs text-brown-700/70">expert treatments</p>
          </div>
          <div className="absolute -right-2 -top-4 hidden rounded-2xl border border-sand-100 bg-cream-50 p-4 shadow-lg sm:block">
            <p className="font-serif text-2xl font-semibold text-gold-dark">
              7 days
            </p>
            <p className="text-xs text-brown-700/70">open every week</p>
          </div>
        </div>
      </div>
    </section>
  );
}
