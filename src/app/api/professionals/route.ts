import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Booking is not configured yet." }, { status: 503 });
  const locationSlug = request.nextUrl.searchParams.get("locationId");
  if (!locationSlug) return Response.json({ error: "Missing location." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: location } = await supabase.from("locations").select("id").eq("slug", locationSlug).eq("active", true).single();
  if (!location) return Response.json({ error: "Location is unavailable." }, { status: 404 });

  const { data, error } = await supabase.rpc("get_public_therapists_for_location", { p_location_id: location.id });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ professionals: (data ?? []).map((row: { therapist_id: string; display_name: string }) => ({ id: row.therapist_id, name: row.display_name })) });
}
