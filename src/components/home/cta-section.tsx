import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="container-page pb-8">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sage-600 to-sage-800 px-6 py-16 text-center shadow-lg sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-cream-50/10 blur-2xl" />
          <div className="absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-balance font-serif text-3xl font-medium text-cream-50 sm:text-4xl">
            Ready to feel renewed?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-cream-100/85">
            Book your treatment online in just a few minutes. Choose your
            service, your therapist and a time that suits you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/book" variant="secondary" size="lg">
              Book Now
            </Button>
            <Button
              href="/contact"
              variant="ghost"
              size="lg"
              className="text-cream-50 hover:bg-cream-50/10"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
