import Link from "next/link";
import type { Service } from "@/lib/services";
import { getCategoryById } from "@/lib/services";
import { formatDuration, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ServiceCard({
  service,
  showCategory = false,
  className,
}: {
  service: Service;
  showCategory?: boolean;
  className?: string;
}) {
  const category = getCategoryById(service.categoryId);

  return (
    <div
      className={cn(
        "group flex h-full flex-col rounded-3xl border border-sand-100 bg-cream-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sand-200 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {showCategory && category ? (
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">
              {category.name}
            </p>
          ) : null}
          <h3 className="font-serif text-xl font-medium text-brown-900">
            {service.name}
          </h3>
        </div>
        {service.popular ? (
          <span className="shrink-0 rounded-full bg-sage-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-sage-700">
            Popular
          </span>
        ) : null}
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-brown-700/80">
        {service.description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-sand-100 pt-4">
        <div className="flex items-center gap-3 text-sm text-brown-700/80">
          <span className="inline-flex items-center gap-1.5">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-sage-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {formatDuration(service.durationMinutes)}
          </span>
          <span className="font-medium text-brown-900">
            {formatPrice(service.price)}
          </span>
        </div>
        <Link
          href={`/book?service=${service.id}`}
          className="rounded-full bg-sage-600 px-4 py-2 text-xs font-medium text-cream-50 transition-colors hover:bg-sage-700"
        >
          Book
        </Link>
      </div>
    </div>
  );
}
