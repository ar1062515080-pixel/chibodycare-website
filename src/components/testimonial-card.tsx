import type { Testimonial } from "@/lib/testimonials";
import { Stars } from "@/components/ui/stars";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-sand-100 bg-cream-50 p-6 shadow-sm">
      <Stars rating={testimonial.rating} />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-brown-800">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-5 border-t border-sand-100 pt-4">
        <p className="font-medium text-brown-900">{testimonial.name}</p>
        <p className="text-xs text-brown-700/60">
          {testimonial.service} · {testimonial.location}
        </p>
      </figcaption>
    </figure>
  );
}
