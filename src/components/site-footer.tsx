import Link from "next/link";
import { navLinks } from "@/lib/nav";
import { business, locations, openingHours } from "@/lib/business";
import { categories } from "@/lib/services";
import { formatTime } from "@/lib/format";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const topCategories = categories.slice(0, 5);
  const topLocations = locations.slice(0, 6);

  return (
    <footer className="mt-24 border-t border-sand-200 bg-brown-900 text-cream-100">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-500 text-cream-50">
              <span className="font-serif text-xl leading-none">氣</span>
            </span>
            <span className="font-serif text-xl font-semibold">
              {business.name}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-100/70">
            {business.shortDescription}
          </p>
          <p className="mt-6 text-sm text-cream-100/70">
            <a
              className="transition-colors hover:text-gold-light"
              href={`mailto:${business.email}`}
            >
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

        <div>
          <h3 className="font-serif text-lg text-cream-50">Opening Hours</h3>
          <ul className="mt-4 space-y-1.5 text-sm text-cream-100/70">
            {openingHours.map((entry) => (
              <li key={entry.day} className="flex justify-between gap-4">
                <span>{entry.day}</span>
                <span className="text-cream-100/60">
                  {formatTime(entry.open)} – {formatTime(entry.close)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-cream-100/10">
        <div className="container-page py-8">
          <h3 className="font-serif text-base text-cream-50">
            Find us across Adelaide
          </h3>
          <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-cream-100/70 sm:grid-cols-2 lg:grid-cols-3">
            {topLocations.map((location) => (
              <li key={location.id} className="flex justify-between gap-3">
                <span>{location.name}</span>
                <a
                  href={`tel:${location.phone.replace(/\s/g, "")}`}
                  className="text-cream-100/60 transition-colors hover:text-gold-light"
                >
                  {location.phone}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-cream-100/50">
            View all {locations.length} locations on our{" "}
            <Link
              href="/contact"
              className="underline transition-colors hover:text-gold-light"
            >
              contact page
            </Link>
            .
          </p>
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
