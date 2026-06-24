import { SectionHeading } from "@/components/ui/section-heading";

const reasons = [
  {
    icon: "🌸",
    title: "Qualified therapists",
    description:
      "Every treatment is delivered by experienced, accredited practitioners who genuinely care about your wellbeing.",
  },
  {
    icon: "🧘",
    title: "Calming spaces",
    description:
      "Tranquil, beautifully designed studios that let you switch off from the moment you arrive.",
  },
  {
    icon: "🌿",
    title: "Natural approach",
    description:
      "We blend traditional Chinese medicine wisdom with modern therapeutic techniques.",
  },
  {
    icon: "📍",
    title: "Always nearby",
    description:
      "With 13 locations across Adelaide, your next moment of calm is never far away.",
  },
];

export function WhyUs() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Why Chi Body Care"
            title="Wellness, thoughtfully delivered"
            description="We believe true wellbeing comes from balance — of body, mind and energy. Every visit is designed to help you slow down, reset and feel your best."
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-50 text-xl">
                  {reason.icon}
                </span>
                <div>
                  <h3 className="font-serif text-lg font-medium text-brown-900">
                    {reason.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-brown-700/75">
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-3xl bg-gradient-to-br from-sage-300 to-sage-500 p-6 text-cream-50 shadow-md">
                <p className="font-serif text-4xl font-semibold">13</p>
                <p className="mt-1 text-sm text-cream-50/85">
                  Adelaide locations
                </p>
              </div>
              <div className="rounded-3xl border border-sand-100 bg-cream-50 p-6 shadow-sm">
                <p className="font-serif text-4xl font-semibold text-gold-dark">
                  10k+
                </p>
                <p className="mt-1 text-sm text-brown-700/75">
                  treatments delivered
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-sand-100 bg-cream-50 p-6 shadow-sm">
                <p className="font-serif text-4xl font-semibold text-sage-600">
                  4.9
                </p>
                <p className="mt-1 text-sm text-brown-700/75">
                  average client rating
                </p>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-sand-300 to-gold-light p-6 text-brown-900 shadow-md">
                <p className="font-serif text-4xl font-semibold">7</p>
                <p className="mt-1 text-sm text-brown-900/75">days a week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
