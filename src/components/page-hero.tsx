import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-sand-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -right-24 -top-16 h-72 w-72 rounded-full bg-sage-200/40 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-champagne/40 blur-3xl" />
      </div>
      <div className="container-page py-16 text-center sm:py-20">
        {eyebrow ? (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-gold-dark">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mx-auto max-w-3xl text-balance font-serif text-4xl font-medium text-brown-900 sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-brown-700/80">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
