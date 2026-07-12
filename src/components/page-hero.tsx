import type { ReactNode } from "react";
import Image from "next/image";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  imageSrc,
  imageAlt = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-gold-dark/15 bg-brown-900 text-cream-50">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[.74] saturate-[.9] contrast-[.9] brightness-[.92]"
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(36,43,36,.91)_0%,rgba(36,43,36,.82)_30%,rgba(36,43,36,.55)_55%,rgba(36,43,36,.25)_75%,rgba(36,43,36,.08)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgba(203,169,99,.18),transparent_34%),linear-gradient(180deg,rgba(39,30,23,.16),rgba(39,30,23,.36))]" />
      <div className="container-page relative py-20 text-center sm:py-24">
        {eyebrow ? (
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-gold-light">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mx-auto max-w-4xl text-balance font-serif text-5xl font-medium leading-[1.03] text-cream-50 drop-shadow-[0_3px_18px_rgba(20,24,20,.3)] sm:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-cream-100/82 sm:text-lg">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
