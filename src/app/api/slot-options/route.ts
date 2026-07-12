import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type OptionRow = { therapist_id: string | null; therapist_display_name: string | null; service_slug: string };

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Booking is not configured yet." }, { status: 503 });
  const locationSlug = request.nextUrl.searchParams.get("locationId");
  const startAt = request.nextUrl.searchParams.get("startAt");
  if (!locationSlug || !startAt || Number.isNaN(new Date(startAt).getTime())) return Response.json({ error: "Missing or invalid slot filters." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: location } = await supabase.from("locations").select("id").eq("slug", locationSlug).eq("active", true).single();
  if (!location) return Response.json({ error: "Location is unavailable." }, { status: 404 });
  const { data, error } = await supabase.rpc("get_options_for_start_time", { p_location_id: location.id, p_start_at: startAt });
  if (error) return Response.json({ error: error.message }, { status: 400 });

  const rows = (data ?? []) as OptionRow[];
  const allServiceIds = Array.from(new Set(rows.map((row) => row.service_slug)));
  const byTherapist = new Map<string, { id: string; name: string; serviceIds: Set<string> }>();
  rows.forEach((row) => {
    if (!row.therapist_id || !row.therapist_display_name) return;
    const item = byTherapist.get(row.therapist_id) ?? { id: row.therapist_id, name: row.therapist_display_name, serviceIds: new Set<string>() };
    item.serviceIds.add(row.service_slug);
    byTherapist.set(row.therapist_id, item);
  });
  const professionals = Array.from(byTherapist.values()).map((item) => ({ id: item.id, name: item.name, serviceIds: Array.from(item.serviceIds) }));
  return Response.json({ professionals, serviceIds: allServiceIds });
}
