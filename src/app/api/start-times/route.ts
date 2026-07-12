import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Booking is not configured yet." }, { status: 503 });
  const locationSlug = request.nextUrl.searchParams.get("locationId");
  const date = request.nextUrl.searchParams.get("date");
  if (!locationSlug || !date) return Response.json({ error: "Missing availability filters." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: location } = await supabase.from("locations").select("id").eq("slug", locationSlug).eq("active", true).single();
  if (!location) return Response.json({ error: "Location is unavailable." }, { status: 404 });
  const { data, error } = await supabase.rpc("get_open_start_times", { p_location_id: location.id, p_date: date, p_slot_interval_minutes: 30 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  const slots = (data ?? []).map((row: { slot_start: string }) => ({
    startAt: row.slot_start,
    time: new Date(row.slot_start).toLocaleTimeString("en-AU", { timeZone: "Australia/Adelaide", hour: "2-digit", minute: "2-digit", hour12: false }),
  }));
  return Response.json({ slots, hasRoster: slots.length > 0, message: slots.length ? undefined : "No online availability for this date. Please call the store to book." });
}
