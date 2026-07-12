import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminLocale, tr } from "@/lib/admin-i18n";

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();
  const locale = await getAdminLocale();
  const today = new Date().toISOString().slice(0, 10);
  const [bookings, rosters, therapists, locations] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }).gte("start_at", `${today}T00:00:00`),
    supabase.from("daily_rosters").select("id", { count: "exact", head: true }).eq("date", today).eq("active", true),
    supabase.from("therapists").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("locations").select("id", { count: "exact", head: true }).eq("active", true),
  ]);
  const cards = [
    [tr(locale, "Upcoming bookings", "即将到来的预约"), bookings.count ?? 0, "/admin/bookings"],
    [tr(locale, "Working today", "今日上班人数"), rosters.count ?? 0, `/admin/roster?date=${today}`],
    [tr(locale, "Active therapists", "启用的治疗师"), therapists.count ?? 0, "/admin/therapists"],
    [tr(locale, "Active locations", "启用的门店"), locations.count ?? 0, "/admin/locations"],
  ] as const;
  return <div><p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Dashboard", "管理总览")}</p><h1 className="mt-2 font-serif text-4xl text-brown-900">{tr(locale, "Booking operations", "预约运营管理")}</h1><p className="mt-2 text-brown-700/70">{tr(locale, `Live overview for ${today}.`, `${today} 实时概览。`)}</p><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, count, href]) => <Link href={href} key={label} className="rounded-3xl border border-sand-200 bg-cream-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="font-serif text-4xl text-sage-700">{count}</p><p className="mt-2 text-sm text-brown-700/75">{label}</p></Link>)}</div></div>;
}
