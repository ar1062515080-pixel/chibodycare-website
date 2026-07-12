import type { Metadata } from "next";
import Image from "next/image";
import { BookingExperience } from "@/components/booking/booking-experience";
import { getServiceById } from "@/lib/services";
import { locations } from "@/lib/business";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Book your Chi Body Care treatment online. Choose a studio, professional, treatment and time.",
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
  let bookingLocations = locations.map(({ id, name, phone }) => ({ id, name, phone }));
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("locations")
      .select("slug,name,phone")
      .eq("active", true)
      .order("name");
    if (data?.length) {
      bookingLocations = data.map((location) => ({
        id: location.slug,
        name: location.name,
        phone: location.phone,
      }));
    }
  }

  return (
    <div className="bg-sand-50/40">
      <div className="relative overflow-hidden border-b border-gold-dark/15 bg-brown-900 text-cream-50">
        <Image
          src="/images/studio/signage-closeup.webp"
          alt="Chi Body Care gold signage"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[.72] saturate-[.9] contrast-[.9] brightness-[.88]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(36,43,36,.92),rgba(36,43,36,.72),rgba(36,43,36,.36))]" />
        <div className="container-page relative py-12 text-center sm:py-16">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-gold-light">
            Online Booking
          </p>
          <h1 className="font-serif text-4xl font-medium text-cream-50 sm:text-5xl">
            Book your treatment
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream-100/80">
            Choose your studio, preferred professional, treatment and a time
            that suits you.
          </p>
        </div>
      </div>

      <BookingExperience initialServiceIds={initialServiceIds} initialLocations={bookingLocations} />
    </div>
  );
}
