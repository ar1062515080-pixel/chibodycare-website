import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return Response.json(
      { error: "Booking is not configured yet." },
      { status: 503 },
    );
  }

  const locationId = request.nextUrl.searchParams.get("locationId");
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const date = request.nextUrl.searchParams.get("date");
  const therapistId = request.nextUrl.searchParams.get("therapistId");
  if (!locationId || !serviceId || !date) {
    return Response.json({ error: "Missing availability filters." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const [locationResult, serviceResult] = await Promise.all([
    supabase.from("locations").select("id").eq("slug", locationId).eq("active", true).single(),
    supabase.from("services").select("id").eq("slug", serviceId).eq("active", true).single(),
  ]);
  if (!locationResult.data || !serviceResult.data) {
    return Response.json({ error: "Location or service is unavailable." }, { status: 404 });
  }
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_location_id: locationResult.data.id,
    p_service_id: serviceResult.data.id,
    p_date: date,
    p_therapist_id: therapistId || null,
    p_slot_interval_minutes: 30,
  });

  if (error) return Response.json({ error: error.message }, { status: 400 });
  const rows = (data ?? []) as Array<Record<string, string | boolean | null>>;
  const hasRoster = rows.length > 0;
  const slots = rows
    .filter((row) => row.slot_start)
    .map((row) => ({
      startAt: String(row.slot_start),
      endAt: String(row.slot_end),
      time: new Date(String(row.slot_start)).toLocaleTimeString("en-AU", {
        timeZone: "Australia/Adelaide",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      therapistId: row.therapist_id ? String(row.therapist_id) : "",
      therapistName: row.therapist_display_name ? String(row.therapist_display_name) : null,
      dailyRosterId: row.daily_roster_id ? String(row.daily_roster_id) : "",
    }));

  return Response.json({
    slots,
    hasRoster,
    message: hasRoster
      ? undefined
      : "No online availability for this date. Please call the store to book.",
  });
}
