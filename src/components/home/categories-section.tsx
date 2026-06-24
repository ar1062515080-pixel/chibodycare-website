import Link from "next/link";
import { categories } from "@/lib/services";
import { SectionHeading } from "@/components/ui/section-heading";

export function CategoriesSection() {
  return (
    <section className="container-page py-16 sm:py-20">
      <SectionHeading
        eyebrow="Our Treatments"
        title="Find the care your body needs"
        description="From deeply relaxing massage to traditional Chinese medicine, every treatment is designed to restore balance and leave you feeling renewed."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/services#${category.id}`}
            className="group flex flex-col rounded-3xl border border-sand-100 bg-cream-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sage-200 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-50 text-2xl transition-colors group-hover:bg-sage-100">
              {category.icon}
            </span>
            <h3 className="mt-4 font-serif text-lg font-medium text-brown-900">
              {category.name}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-brown-700/75">
              {category.tagline}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sage-600 transition-colors group-hover:text-sage-700">
              View treatments
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
