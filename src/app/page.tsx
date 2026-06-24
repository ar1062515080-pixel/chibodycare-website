import { Hero } from "@/components/home/hero";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedServices } from "@/components/home/featured-services";
import { WhyUs } from "@/components/home/why-us";
import { TeamPreview } from "@/components/home/team-preview";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CtaSection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <FeaturedServices />
      <WhyUs />
      <TeamPreview />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
