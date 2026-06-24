import Link from "next/link";
import { signOut } from "@/app/admin/actions";

const links = [
  ["Overview", "/admin"],
  ["Daily roster", "/admin/roster"],
  ["Bookings", "/admin/bookings"],
  ["Therapists", "/admin/therapists"],
  ["Locations", "/admin/locations"],
] as const;

export function AdminNav() {
  return (
    <aside className="border-b border-sand-200 bg-brown-900 text-cream-50 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-6">
        <p className="font-serif text-2xl">Chi Body Care</p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gold-light">Management</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="whitespace-nowrap rounded-xl px-4 py-3 text-sm text-cream-100/80 hover:bg-cream-50/10 hover:text-cream-50">{label}</Link>
        ))}
      </nav>
      <form action={signOut} className="px-3 pb-5 lg:mt-auto">
        <button className="w-full rounded-xl border border-cream-100/20 px-4 py-2 text-sm hover:bg-cream-50/10">Sign out</button>
      </form>
    </aside>
  );
}

