import type { Metadata } from "next";
import { BookingExperience } from "@/components/booking/booking-experience";
import { getServiceById } from "@/lib/services";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Book your Chi Body Care treatment online. Choose your services, professional and a time that suits you.",
};

type SearchParams = Promise<{
  service?: string | string[];
}>;

/** Parse the ?service= deep link into a clean list of valid service ids. */
function parseServiceParam(param?: string | string[]): string[] {
  if (!param) return [];
  const raw = Array.isArray(param) ? param : [param];
  const ids = raw.flatMap((value) => value.split(","));
  const unique = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  return unique.filter((id) => getServiceById(id));
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialServiceIds = parseServiceParam(params.service);

  return (
    <div className="bg-sand-50/40">
      <div className="border-b border-sand-100 bg-cream-50">
        <div className="container-page py-10 text-center sm:py-12">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-gold-dark">
            Online Booking
          </p>
          <h1 className="font-serif text-3xl font-medium text-brown-900 sm:text-4xl">
            Book your treatment
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brown-700/80">
            A few simple steps to your moment of calm. Select your treatments,
            choose a professional and pick a time.
          </p>
        </div>
      </div>

      <BookingExperience initialServiceIds={initialServiceIds} />
    </div>
  );
}
