import Link from "next/link";
import Image from "next/image";
import { navLinks } from "@/lib/nav";
import { business } from "@/lib/business";
import { categories } from "@/lib/services";

export function SiteFooter({ flush = false }: { flush?: boolean }) {
  const year = new Date().getFullYear();
  const topCategories = categories.slice(0, 5);

  return (
    <footer className={`${flush ? "mt-0" : "mt-8"} border-t border-sand-200 bg-brown-900 text-cream-100`}>
      <div className="container-page grid gap-12 py-16 md:grid-cols-3">
        <div>
          <Link href="/" aria-label="Chi Body Care home" className="inline-flex rounded-full bg-cream-50/95 p-1 shadow-sm">
            <Image src="/images/chi-logo.png" alt="Chi Body Care" width={1024} height={1024} className="h-20 w-20 object-contain" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-100/70">
            {business.shortDescription}
          </p>
          <p className="mt-6 text-sm text-cream-100/70">
            <a className="transition-colors hover:text-gold-light" href={`mailto:${business.email}`}>
              {business.email}
            </a>
          </p>
        </div>

        <div>
          <h3 className="font-serif text-lg text-cream-50">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-cream-100/70">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-gold-light"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/book"
                className="transition-colors hover:text-gold-light"
              >
                Book Now
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-lg text-cream-50">Treatments</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-cream-100/70">
            {topCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/services#${category.id}`}
                  className="transition-colors hover:text-gold-light"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className="border-t border-cream-100/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream-100/50 sm:flex-row">
          <p>
            © {year} {business.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p>{business.abnLabel}</p>
            <Link
              href="/admin/login"
              className="transition-colors hover:text-gold-light"
            >
              Admin login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
