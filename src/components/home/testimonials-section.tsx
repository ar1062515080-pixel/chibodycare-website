import { testimonials } from "@/lib/testimonials";
import { SectionHeading } from "@/components/ui/section-heading";
import { TestimonialCard } from "@/components/testimonial-card";

export function TestimonialsSection() {
  return (
    <section className="container-page py-16 sm:py-20">
      <SectionHeading
        eyebrow="Kind Words"
        title="Loved by our community"
        description="Real experiences from clients who've made Chi Body Care part of their wellness routine."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>
    </section>
  );
}
